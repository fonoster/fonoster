import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ApplicationForm from '../_components/form/ApplicationForm';
import { ApplicationType } from '@fonoster/types';
import { ApplicationFormData } from '../_components/form/ApplicationForm';

export default function EditApplicationPage() {
    const router = useRouter();
    const { applicationId } = router.query;
    const [isLoading, setIsLoading] = useState(true);
    const [application, setApplication] = useState<ApplicationFormData | null>(null);

    // Simulate fetching application data
    useEffect(() => {
        if (!applicationId) return;

        // This would be replaced with an actual API call
        const fetchData = async () => {
            try {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Mock data for demonstration
                const mockData: ApplicationFormData = {
                    ref: applicationId as string,
                    name: 'Sample Application',
                    description: 'This is a sample application',
                    type: ApplicationType.EXTERNAL,
                    endpoint: 'https://example.com/webhook',
                    textToSpeech: {
                        vendor: 'deepgram',
                        voice: 'aura_asteria_en'
                    },
                    speechToText: {
                        vendor: 'deepgram',
                        model: 'nova-2',
                        language: 'en-US'
                    }
                };

                setApplication(mockData);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching application:', error);
                setIsLoading(false);
            }
        };

        fetchData();
    }, [applicationId]);

    return (
        <ApplicationForm
            initialValues={application}
            isLoading={isLoading}
        />
    );
} 