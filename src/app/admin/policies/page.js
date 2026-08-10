import PolicyService from '@/core/Services/Admin/PolicyService.js';
import PoliciesClientWrapper from './PoliciesClientWrapper.js';

export const metadata = {
    title: 'Legal & Policy Matrix | Admin Dashboard',
    description: 'Configure Core System Rules & Directives'
};

export default async function PoliciesPage() {
    let rawPolicies = [];
    
    try {
        rawPolicies = await PolicyService.getPolicies();
    } catch (e) {
        // Handle gracefully
    }
    
    const initialPolicies = JSON.parse(JSON.stringify(rawPolicies || []));

    return <PoliciesClientWrapper initialPolicies={initialPolicies} />;
}
