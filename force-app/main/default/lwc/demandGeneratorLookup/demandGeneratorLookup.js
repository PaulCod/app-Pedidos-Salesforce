import { LightningElement, api } from 'lwc';
import searchAccounts from '@salesforce/apex/ActivityDemandGeneratorController.searchAccounts';

export default class DemandGeneratorLookup extends LightningElement {
    @api label;
    @api selectedId;
    @api selectedName;

    searchTerm = '';
    results = [];
    searchTimeout;

    get hasSelection() {
        return this.selectedId && this.selectedName;
    }

    get hasResults() {
        return this.results && this.results.length > 0;
    }

    get accountUrl() {
        return `/lightning/r/Account/${this.selectedId}/view`;
    }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;

        window.clearTimeout(this.searchTimeout);

        this.searchTimeout = setTimeout(() => {
            this.search();
        }, 300)
    }

    async search() {
        try {
            const term = this.searchTerm || '';

            this.results = await searchAccounts({
                searchTerm: term
            }) 
        } catch(error) {
            this.results = []
            console.error(error)
        }
    }

    handleSelect(event) {
        const id = event.currentTarget.dataset.id;
        const name = event.currentTarget.dataset.name;

        this.selectedId = id;
        this.searchTerm = '';
        this.results = [];

        this.dispatchEvent(
            new CustomEvent('selectrecord', {
                detail: {
                    id,
                    name
                }
            })
        )
    }

    handleClear() {
        this.selectedId = null;
        this.selectedName = null;
        this.searchTerm = '';
        this.results = [];

        this.dispatchEvent(
            new CustomEvent('selectrecord', {
                detail: {
                    id: null,
                    name: null
                }
            })
        )
    }
}