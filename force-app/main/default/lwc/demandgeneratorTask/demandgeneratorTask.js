import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveGenerators from '@salesforce/apex/ActivityDemandGeneratorController.saveGenerators';

const FIELDS = [
    'Task.Account_ID_1__c',
    'Task.Account_ID_2__c'
];

export default class DemandgeneratorTask extends LightningElement {
    @api recordId;

    arquiteturaId;
    engenhariaId;

    isLoading = false;

    @wire(getRecord, {recordId: '$recordId', fields: FIELDS})
    wiredTask({data, error}) {
        if(data){
            this.arquiteturaId = data.fields.Account_ID_1__c?.value;
            this.arquiteturaId = data.fields.Account_ID_2__c?.value;
        } else if(error) {
            this.showToast('Erro', 'Erro ao carregar dados da Task.', "error");
        }
    }

    handleArquiteturaSelect(event) {
        this.arquiteturaId = event.detail.id;
    }

    handleEngenhariaSelect(event) {
        this.engenhariaId = event.detail.id;
    }

    async handleSave() {
        this.isLoading = true;

        try {
            await saveGenerators({
                taskId: this.recordId,
                arquiteturaId: this.arquiteturaId,
                engenhariaId: this.engenhariaId
            })

            this.showToast('Sucesso', 'Geradores de demanda salvos com sucesso', 'success')
        } catch (error) {
            this.showToast("Erro", error.body?.message || 'Erro ao salvar.', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent(
                title,
                message,
                variant
            )
        )
    }

}