import { LightningElement } from 'lwc';
import getProductsByAccount from '@salesforce/apex/PedidoAppController.getProductsByAccount';
import createOrder from '@salesforce/apex/PedidoAppController.createOrder';

export default class PedidoApp extends LightningElement {
    currentStep = 1;

    selectedAccountId;
    products = [];
    cart = [];
    discountPercent = 0;
    isLoading = false;
    errorMessage;
    paymentCondition;
    showCelebration = false;

    get isStepCustomer() {
        return this.currentStep === 1;
    }

    get isStepProducts() {
        return this.currentStep === 2;
    }

    get isStepCart() {
        return this.currentStep === 3;
    }

    get isStepSummary() {
        return this.currentStep === 4;
    }

    get isStepConfirmation() {
        return this.currentStep === 5;
    }

    get customerStepClass() {
        return this.isStepCustomer ? 'step active' : 'step';
    }

    get productsStepClass() {
        return this.isStepProducts ? 'step active' : 'step';
    }

    get cartStepClass() {
        return this.isStepCart ? 'step active' : 'step';
    }

    get summaryStepClass() {
        return this.isStepSummary ? 'step active' : 'step';
    }

    get confirmationStepClass() {
        return this.isStepConfirmation ? 'step active' : 'step';
    }

    get showBackButton() {
        return this.currentStep > 1 && this.currentStep < 5;
    }

    get showNextButton() {
        return this.currentStep < 5;
    }

    get nextButtonLabel() {
        return this.currentStep === 4 ? 'Criar Pedido' : 'Próximo';
    }

    get cartCount() {
        return this.cart.length;
    }

    get subtotal() {
        return this.cart.reduce((total, item) => total + item.subtotal, 0);
    }

    get discountAmount() {
        return this.subtotal * (this.discountPercent / 100);
    }

    get totalAmount() {
        return this.subtotal - this.discountAmount;
    }

    get formattedSubtotal() {
        return this.formatCurrency(this.subtotal);
    }

    get formattedDiscountAmount() {
        return this.formatCurrency(this.discountAmount);
    }

    get formattedTotalAmount() {
        return this.formatCurrency(this.totalAmount);
    }

    get productsWithFormattedValues() {
        return this.products.map(product => {
            return {
                ...product,
                formattedPrice: this.formatCurrency(product.unitPrice),
                formattedSubtotal: this.formatCurrency(product.unitPrice * product.quantity)
            };
        });
    }

    get orderPaymentConditionOptions() {
        return [
            {label: "À vista", value: "À vista" },
            {label: "À prazo", value: "À prazo" },
        ]
    }

    handleAccountChange(event) {
        this.selectedAccountId = event.detail.recordId || event.detail.value;;
        this.products = [];
        this.cart = [];
    }

    async handleNext() {
        this.errorMessage = null;

        if (this.currentStep === 1) {
            if (!this.selectedAccountId) {
                this.errorMessage = 'Selecione uma conta antes de continuar.';
                return;
            }

            await this.loadProductsByAccount();
            this.currentStep = 2;
            return;
        }

        if (this.currentStep === 2 && this.cart.length === 0) {
            this.errorMessage = 'Adicione pelo menos um produto ao carrinho.';
            return;
        }

        if (this.currentStep === 4) {
            await this.handleCreateOrder();
            return;
        }

        if (this.currentStep < 5) {
            this.currentStep += 1;
        }
    }

    handleBack() {
        if (this.currentStep > 1) {
            this.currentStep -= 1;
        }
    }

    async loadProductsByAccount() {
        this.isLoading = true;

        try {
            const result = await getProductsByAccount({
                accountId: this.selectedAccountId
            });

            this.products = result.map(item => {
                return {
                    ...item,
                    id: item.pricebookEntryId,
                    quantity: item.multipleQuantity || 1
                };
            });
        } catch (error) {
            this.errorMessage = error.body?.message || 'Erro ao buscar produtos.';
        } finally {
            this.isLoading = false;
        }
    }

    handleProductQuantityChange(event) {
        const productId = event.target.dataset.id;
        const quantity = Number(event.target.value);

        this.products = this.products.map(product => {
            if (product.id === productId) {
                return {
                    ...product,
                    quantity
                };
            }

            return product;
        });
    }

    handleAddToCart(event) {
        const productId = event.target.dataset.id;
        const product = this.products.find(item => item.id === productId);

        if (!product) {
            return;
        }

        const quantity = Number(product.quantity);
        const multiple = Number(product.multipleQuantity || 1);

        if (!quantity || quantity <= 0) {
            this.errorMessage = 'Informe uma quantidade válida.';
            return;
        }

        if (quantity % multiple !== 0) {
            this.errorMessage = `A quantidade precisa ser múltipla de ${multiple}.`;
            return;
        }

        const cartItem = {
            id: product.id,
            pricebookEntryId: product.pricebookEntryId,
            productId: product.productId,
            productName: product.productName,
            unitPrice: product.unitPrice,
            quantity,
            multipleQuantity: multiple,
            subtotal: product.unitPrice * quantity,
            formattedPrice: this.formatCurrency(product.unitPrice),
            formattedSubtotal: this.formatCurrency(product.unitPrice * quantity)
        };

        const alreadyExists = this.cart.some(item => item.id === productId);

        if (alreadyExists) {
            this.cart = this.cart.map(item => {
                return item.id === productId ? cartItem : item;
            });
        } else {
            this.cart = [...this.cart, cartItem];
        }

        this.errorMessage = null;
    }

    handleRemoveFromCart(event) {
        const productId = event.target.dataset.id;
        this.cart = this.cart.filter(item => item.id !== productId);
    }

    handleDiscountChange(event) {
        let value = Number(event.target.value);

        if (value < 0) {
            value = 0;
        }

        if (value > 70) {
            value = 70;
        }

        this.discountPercent = value;
    }

    handleNewOrder() {
        this.currentStep = 1;
        this.selectedAccountId = null;
        this.products = [];
        this.cart = [];
        this.discountPercent = 0;
        this.errorMessage = null;
    }

    handlePaymentConditionChange(event) {
        this.paymentCondition = event.target.value;
    }

    async handleCreateOrder() {
        this.isLoading = true;
        this.errorMessage = null;

        if (!this.selectedAccountId) {
            this.errorMessage = 'Conta não encontrada. Volte e selecione a conta novamente.';
            this.isLoading = false;
            return;
        }

        if (!this.paymentCondition) {
            this.errorMessage = 'Selecione a condição de pagamento.';
            this.isLoading = false;
            return;
        }

        try {
            const request = {
                accountId: this.selectedAccountId,
                discountPercent: this.discountPercent,
                paymentCondition: this.paymentCondition,
                items: this.cart.map(item => {
                    return {
                        pricebookEntryId: item.pricebookEntryId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice
                    };
                })
            };

            this.createdOrderId = await createOrder({ request });
            this.currentStep = 5;
            this.showCelebration = true;
        } catch (error) {
             console.error('Erro createOrder:', JSON.stringify(error));

            this.errorMessage =
                error?.body?.message ||
                error?.body?.pageErrors?.[0]?.message ||
                error?.body?.fieldErrors
                    ? JSON.stringify(error.body.fieldErrors)
                    : 'Erro ao criar pedido.';
        } finally {
            this.isLoading = false;
        }
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    }
}