public with sharing class PedidoAppController {

    public class ProductDTO {
        @AuraEnabled public Id pricebookEntryId { get; set; }
        @AuraEnabled public Id productId { get; set; }
        @AuraEnabled public String productName { get; set; }
        @AuraEnabled public String productCode { get; set; }
        @AuraEnabled public String family { get; set; }
        @AuraEnabled public Decimal unitPrice { get; set; }
        @AuraEnabled public Decimal multipleQuantity { get; set; }
    }

    public class OrderItemDTO {
        @AuraEnabled public Id pricebookEntryId { get; set; }
        @AuraEnabled public Decimal quantity { get; set; }
        @AuraEnabled public Decimal unitPrice { get; set; }
    }

    public class CreateOrderRequest {
        @AuraEnabled public Id accountId { get; set; }
        @AuraEnabled public Decimal discountPercent { get; set; }
        @AuraEnabled public String paymentCondition { get; set; }
        @AuraEnabled public List<OrderItemDTO> items { get; set; }
    }

    @AuraEnabled(cacheable=true)
    public static List<ProductDTO> getProductsByAccount(Id accountId) {
        if (accountId == null) {
            throw new AuraHandledException('Informe uma conta.');
        }

        Account acc = [
            SELECT Id, Name, Price_Book__c, Price_Book__r.Name
            FROM Account
            WHERE Id = :accountId
            LIMIT 1
        ];

        if (acc.Price_Book__c == null) {
            throw new AuraHandledException('A conta selecionada não possui Price Book vinculado.');
        }

        List<ProductDTO> products = new List<ProductDTO>();

        for (PricebookEntry pbe : [
            SELECT Id,
                   UnitPrice,
                   ProductCode,
                   Product2Id,
                   Product2.Name,
                   Product2.Family,
                   MultipleQuantityOfProduct__c
            FROM PricebookEntry
            WHERE Pricebook2Id = :acc.Price_Book__c
            AND IsActive = true
            AND Product2.IsActive = true
            ORDER BY Product2.Name
        ]) {
            ProductDTO dto = new ProductDTO();
            dto.pricebookEntryId = pbe.Id;
            dto.productId = pbe.Product2Id;
            dto.productName = pbe.Product2.Name;
            dto.productCode = pbe.ProductCode;
            dto.family = pbe.Product2.Family;
            dto.unitPrice = pbe.UnitPrice;
            dto.multipleQuantity = pbe.MultipleQuantityOfProduct__c == null
                ? 1
                : pbe.MultipleQuantityOfProduct__c;

            products.add(dto);
        }

        return products;
    }

    @AuraEnabled
    public static Id createOrder(CreateOrderRequest request) {
        if(request == null || request.accountId == null) {
            throw new AuraHandledException('Informe pelo menos uma conta');
        }

        if(request.items == null || request.items.isEmpty()) {
            throw new AuraHandledException('Informe pelo menos um item para o pedido');
        }

        Account acc = [
            SELECT Id, Name, Price_Book__c
            FROM Account
            WHERE Id = :request.accountId
            LIMIT 1
        ];

        if (acc.Price_Book__c == null) {
            throw new AuraHandledException('A conta não possui Price Book vinculado.');
        }

        Order orderRecord = new Order();
        orderRecord.AccountId = acc.Id;
        orderRecord.Pricebook2Id = acc.Price_Book__c;
        orderRecord.Discount__c = request.discountPercent;
        orderRecord.PaymentCondition__c = request.paymentCondition;
        orderRecord.Status = 'Draft';
        orderRecord.EffectiveDate = Date.today();

        insert orderRecord;

        List<OrderItem> orderItems = new List<OrderItem>();

        for (OrderItemDTO item : request.items) {
            OrderItem oi = new OrderItem();
            oi.OrderId = orderRecord.Id;
            oi.PricebookEntryId = item.pricebookEntryId;
            oi.Quantity = item.quantity;
            oi.UnitPrice = item.unitPrice;
            orderItems.add(oi);
        }

        insert orderItems;

        return orderRecord.OrderNumber;
    }
}