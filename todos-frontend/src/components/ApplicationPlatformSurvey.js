import axios from '../utils/axios';
import { Alert, Button, Form } from 'react-bootstrap';
import { useEffect, useState, React } from 'react';

function ApplicationPlatformSurvey({ currentUser }) {
    const [showAlert, setShowAlert] = useState(true);
    const [platformChoices, setPlatformChoices] = useState([]);
    const [electedIds, setElectedIds] = useState([]);

    const fetchElections = async () => {
        try {
            const response = await axios.get('/tasks/api/platform-registrations/');
            const extractedIds = response.data.map(item => item.platform_template.id);
            setElectedIds(extractedIds);
            return extractedIds;
        } catch (error) {
            console.error("Error getting user elections", error);
        }
    };

    const fetchAvailableChoices = async (excludedIds) => {
        // Get remaining platform choices. Set up below so that it only runs after electedIds is updated
        try {
            const response = await axios.get('/tasks/api/platform-templates/')
            const remainingChoices = response.data.filter((choice) => !excludedIds.includes(choice.id));
            setPlatformChoices(remainingChoices);
        } catch (error) {
            console.error("Error fetching platform choices", error);
        }
    };

    useEffect(() => {
        // See what the user has already elected
        const runSequentially = async () => {
            // Refresh user elections. Also runs after they submit the form given we are reloading
            const extractedIds = await fetchElections();

            // Refresh available choices. Also runs after they submit the form given we are reloading
            await fetchAvailableChoices(extractedIds);
        };
        
        runSequentially();
        
    }, []);

    const handleCheckboxChange = (event) => {
        // If a checkbox is checked, add it to a newly elected list. Remove if unchecked
        const id = parseInt(event.target.value);

        if (event.target.checked) {
            setElectedIds((prev) => [...prev, id]);
        } else {
            setElectedIds((prev) => prev.filter((val) => val !== id))
        }
    };

    const submitPlatforms = (event) => {
        event.preventDefault();

        // Record new elections in PlatformTemplateSubmission model
        // Django backend will create the new corresponding Application and ToDo objects as well
        axios.post(`/tasks/api/platform-registrations/`, {
            "platform_ids": electedIds,
        })
        .then((response) => {
            console.log(response.data);
        })
        .catch((error) => {
            console.error("Error registering new platforms", error);
        });

        // Refresh the window. 
        // Shortcut to just get the applications and todos refreshed to avoid sharing states across files
        window.location.reload();
    };

    return currentUser?.role === "mentee" && showAlert && (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Alert key='primary' variant='primary' dismissible onClose={() => setShowAlert(false)}>
                <Alert.Heading>
                    Platforms
                </Alert.Heading>
                <p>Which of the following platforms will you be using to apply to schools?</p>
                <Form onSubmit={submitPlatforms}>
                    <div className="mb-2">
                        {platformChoices.map((choice) => (
                            <Form.Check
                                key={choice.id}
                                type="checkbox"
                                id={choice.id}
                                label={choice.name}
                                value={choice.id}
                                checked={electedIds.includes(choice.id)}
                                onChange={handleCheckboxChange}
                            />
                        ))}
                    </div>
                    <Button type="submit">Submit</Button>
                </Form>
            </Alert>
        </div>
    );
}

export default ApplicationPlatformSurvey;