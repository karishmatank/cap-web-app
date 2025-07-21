import OneSignal from 'react-onesignal';
import useCurrentUser from '../hooks/useCurrentUser';
import { useEffect } from "react";



export default function PushInitializer() {
    /* OneSignal initialization to get push notifications working */

    const { currentUser } = useCurrentUser();

    useEffect(() => {
        async function initOneSignal() {
            if (!window.__oneSignalInit) {
                await OneSignal.init({
                    appId: "dce8adf1-552d-4b68-ae13-0ee2688ee21d",
                    // safari_web_id: "web.onesignal.auto.253751a8-ac24-4181-97da-883dbdadac49",
                    notifyButton: {
                        enable: true,
                        size: 'medium',
                        position: 'bottom-left',
                        offset: { bottom: '50px', left: '10px' },
                        showCredit: false,
                        displayPredicate: async () => {
                            // Hide the bell after user is subscribed
                            return !OneSignal.User.PushSubscription.optedIn;
                        }
                    }
                    // serviceWorkerPath: "/OneSignalSDKWorker.js",
                    // serviceWorkerParam: { scope: "/" }
                });
                window.__oneSignalInit = true;
                console.log("OneSignal started, todos frontend");
            }

            if (currentUser) {
                await OneSignal.login(currentUser.id);
                console.log("User logged in, todos frontend");
            }

        }

        initOneSignal().catch(console.error);

    }, [currentUser]);

    return null;
}