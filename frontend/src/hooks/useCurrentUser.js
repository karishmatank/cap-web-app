import { useState, useEffect } from "react";
import axios from "axios";

export default function useCurrentUser() {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        axios.get("/users/api/me/")
        .then((response) => {
            setCurrentUser(response.data);
        })
        .catch((error) => {
            console.error("Not logged in", error);
            setCurrentUser(null);
        })
        .finally(() => {
            setLoading(false);
        });
    }, []);

    return { currentUser, loading };
}