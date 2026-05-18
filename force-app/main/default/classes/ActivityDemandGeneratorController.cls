public with sharing class ActivityDemandGeneratorController {
    public ActivityDemandGeneratorController() {

    }

    @AuraEnabled(cachable=true)
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
        Id taskId;

        Id arquiteturaId,

        Id EngenhariaId
    ) {
        
        Task t = new Task(
            Id = taskId,

            Account_ID_1__c = arquiteturaId,

            Account_ID_2__c = EngenhariaId
        );

        update t;
    }
}