public with sharing class ActivityDemandGeneratorController {
    public ActivityDemandGeneratorController() {

    }

    @AuraEnabled(cacheable=true)
    public static List<Account> searchAccounts(String searchTerm) {
        String term = '%' + String.escapeSingleQuotes(searchTerm) + '%';

        return [
            SELECT Id, Name
            FROM Account
            WHERE RecordType.DeveloperName = 'DemandGenerator'
            AND Name LIKE :term
            ORDER BY Name
            Limit 10
        ];
    }

    @AuraEnabled
    public static void saveGenerators(
        Id taskId,

        Id arquiteturaId,
        String arquiteturaName,

        Id engenhariaId,
        String engenhariaName
    ) {
        
        Task t = new Task(
            Id = taskId,

            Account_ID_1__c = arquiteturaId,
            Account_1_Name__c = arquiteturaName,

            Account_ID_2__c = engenhariaId,
            Account_2_Name__c = engenhariaName
        );

        update t;
    }
}
