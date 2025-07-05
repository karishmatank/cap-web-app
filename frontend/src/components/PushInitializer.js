import * as PusherPushNotifications from '@pusher/push-notifications-web';
import useCurrentUser from '../hooks/useCurrentUser';
import { useEffect } from "react";



export default function PushInitializer() {
    /* Pusher Beams initialization to get push notifications working */

    const { currentUser } = useCurrentUser();

    useEffect(() => {
        async function initBeams() {
            if (!currentUser) return;

            // Wait for the service worker
            const serviceWorkerRegistration = await window.navigator.serviceWorker.ready;

            // Initialize Beams
            const beamsClient = new PusherPushNotifications.Client({
                instanceId: '8d02d63d-a0b7-4438-99f6-20118fe15ab1',
                serviceWorkerRegistration: serviceWorkerRegistration,
            });
            
            const tokenProvider = new PusherPushNotifications.TokenProvider({
                url: '/users/api/beams-auth/'
            });

            await beamsClient.start();
            await beamsClient.setUserId(currentUser.id, tokenProvider);

            // expose it globally for everyone
            window.beamsClient = beamsClient;

            console.log('Beams started with existing SW!');
        }

        initBeams().catch(console.error);

    }, [currentUser]);

    return null;
}

