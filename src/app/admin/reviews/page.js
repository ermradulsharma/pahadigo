import ReviewService from '@/core/Services/Admin/ReviewService.js';
import ReviewsClientWrapper from './ReviewsClientWrapper.js';

export const metadata = {
    title: 'Feedback Nexus | Admin Dashboard',
    description: 'Monitor and regulate user sentiment.'
};

export default async function ReviewModerationPage() {
    let rawReviews = [];
    
    try {
        rawReviews = await ReviewService.getAllReviews();
    } catch (e) {
        // Handle gracefully
    }
    
    const initialReviews = JSON.parse(JSON.stringify(rawReviews || []));

    return <ReviewsClientWrapper initialReviews={initialReviews} />;
}
