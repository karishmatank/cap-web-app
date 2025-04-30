import axios from '../utils/axios';
import { Alert, Button, Form } from 'react-bootstrap';
import { useEffect, useState, React } from 'react';

function ApplicationPlatformSurvey() {
    const [showAlert, setShowAlert] = useState(true);
    const [platformChoices, setPlatformChoices] = useState([]);
    const [electedIds, setElectedIds] = useState([]);

    const fetchElections = () => {
        axios.get('/tasks/api/platform-registrations/')
        .then((response) => {
            const extractedIds = response.data.map(item => item.platform_template.id);
            setElectedIds(extractedIds);
        })
        .catch((error) => {
            console.error("Error getting user elections", error);
        });
    };

    useEffect(() => {
        // See what the user has already elected
        fetchElections();
    }, []);

    useEffect(() => {
        if (electedIds.length > 0) {
            // Get remaining platform choices. Only runs after electedIds is updated
            axios.get('/tasks/api/platform-templates/')
            .then((response) => {
                const remainingChoices = response.data.filter((choice) => !electedIds.includes(choice.id));
                setPlatformChoices(remainingChoices);
            })
            .catch((error) => {
                console.error("Error fetching platform choices", error);
            });
        }
    }, [electedIds]);

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

        // Refresh user elections after they submit the form
        fetchElections();
    };

    return showAlert && (
        <div style={{ width: '50%' }}>
            <Alert key='primary' variant='primary' dismissible onClose={() => setShowAlert(false)}>
                <Alert.Heading>
                    Platforms
                </Alert.Heading>
                <p>Which of the following platforms will you be using to apply to schools?</p>
                <Form onSubmit={submitPlatforms}>
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
                    <Button type="submit">Submit</Button>
                </Form>
            </Alert>
        </div>
    );
}

export default ApplicationPlatformSurvey;