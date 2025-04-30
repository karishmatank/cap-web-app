import axios from '../utils/axios';
import { useEffect, useState, React } from 'react';
import { Modal, Button, Form, FloatingLabel, Table} from 'react-bootstrap';
import { EditableInput, EditableSelect, EditableTextArea } from '../utils/EditableFields';

function ApplicationList() {
    const [apps, setApps] = useState([]);
    const [appData, setAppData] = useState({});
    const tableVisibleFields = [
        {'field_name': 'status', 'type': 'select', 'width': '15%'}, 
        {'field_name': 'name', 'type': 'text', 'width': '25%'}, 
        {'field_name': 'category', 'type': 'select', 'width': '15%'}, 
        {'field_name': 'platform_template', 'type': 'select', 'width': '15%'},
        {'field_name': 'notes', 'type': 'textarea', 'width': '40%'}
    ];
    const [showModal, setShowModal] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [platformOptions, setPlatformOptions] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);
    const [mode, setMode] = useState("");

    // Get category and platform choices to use for the form
    useEffect(() => {
        axios.get("/tasks/api/applications/category_choices/")
        .then((response) => {
            setCategoryOptions(response.data);
        })
        .catch((error) => {
            console.error("Error retrieving application categories", error);
        });

        axios.get("/tasks/api/platform-registrations/")
        .then((response) => {
            const extractedOptions = response.data.map((item) => item.platform_template);
            setPlatformOptions(extractedOptions);
        })
        .catch((error) => {
            console.error("Error retrieving application school platforms", error);
        });

        axios.get("/tasks/api/applications/status_choices/")
        .then((response) => {
            setStatusOptions(response.data);
        })
        .catch((error) => {
            console.error("Error retrieving application status options", error);
        });

    }, []);

    // Changes to form when creating or editing an application's information
    const handleChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;

        setAppData((prev) => ({
            ...prev,
            [name]: name === "platform_template" ? (value !== "" ? parseInt(value): null) : value
        }));
    };

    // Create a new application
    const createApplication = (event) => {
        // Prevent a full page reload by preventing default behavior. We handle the form ourselves
        event.preventDefault();

        axios.post("/tasks/api/applications/", appData)
        .then((response) => {
            console.log("Application created: ", response.data);
            setMode("");
            setAppData({});
            setShowModal(false);
            fetchApplications();
        })
        .catch((error) => {
            console.error("Error creating application: ", error);
        });
    };

    // Edit an application
    const editApplication = (event, id) => {
        event.preventDefault();

        axios.put(`/tasks/api/applications/${id}/`, appData)
        .then((response) => {
            console.log("Application updated", response.data);
            setMode("");
            setAppData({});
            setShowModal(false);
            fetchApplications();
        })
        .catch((error) => {
            console.error("Error updating application: ", error);
        });
    };

    // Delete application
    const deleteApplication = (id) => {
        axios.delete(`/tasks/api/applications/${id}/`)
        .then((response) => {
            console.log("Application deleted", response.data);
            setMode("");
            setAppData({});
            setShowModal(false);
            fetchApplications();
        })
        .catch((error) => {
            console.error("Error deleting application", error);
        });
    };

    // Update a specific field inline in table
    const updateField = (id, field, value) => {
        // Update apps list before submitting patch request so that update looks seamless on the table
        setApps((prevApps) => 
            prevApps.map((app) => 
                app.id === id ? {...app, [field]: value } : app
            )
        );

        axios.patch(`/tasks/api/applications/${id}/`, {
            [field]: value
        })
        .then((response) => {
            console.log("Application field updated", response.data);
            fetchApplications();
        })
        .catch((error) => {
            console.error("Error modifying application", error);
        });
    };

    const fetchApplications = () => {
        axios.get("/tasks/api/applications/")
        .then((response) => {
            setApps(response.data);
        })
        .catch((error) => {
            console.error("Error retrieving user apps", error);
        });
    };

    // Get all applications that the user has started when they view the page
    // We already filter for the current user in our API view
    useEffect(() => {
        fetchApplications();
    }, []);

    return (
        <div className="application-list-content container">
            <div className="application-create d-flex justify-content-between align-items-center mb-3">
                <div className="mt-4">
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => {
                            setMode("create");
                            setAppData({});
                            setShowModal(true);
                        }}
                    >
                        + Add Application
                    </Button>
                </div>
            </div>

            {/* Modal for form that contains the fields we need to create a new application entry */}
            <Modal 
                show={showModal} 
                onHide={() => setShowModal(false)}
                size="lg"
            >
                <Form 
                    className="modal-form"
                    onSubmit={(event) => {
                        if (mode === "create") {
                            createApplication(event);
                        } else {
                            editApplication(event, appData.id);
                        }
                    }}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>{mode === "create" ? "Add New Application" : "Edit Application"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <FloatingLabel controlId='floatingCategory' label="Category" className="mb-3 form-field">
                            <Form.Select name="category" value={appData.category || ""} onChange={handleChange} required>
                                <option value="" disabled>Select a category</option>
                                {categoryOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </FloatingLabel>
                        <FloatingLabel controlId='floatingName' label="Application Name" className="mb-3 form-field">
                            <Form.Control 
                                type="text"
                                name="name"
                                placeholder="School or Program Name"
                                value={appData.name || ""}
                                onChange={handleChange}
                                required
                            />
                        </FloatingLabel>
                        {appData.category === 'school' && (
                            <FloatingLabel controlId='floatingPlatform' label="Platform, If Applicable" className="mb-3 form-field">
                                <Form.Select name="platform_template" value={appData.platform_template || ""} onChange={handleChange}>
                                    <option value="">Select a platform</option>
                                    {platformOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </FloatingLabel>
                        )}
                        <FloatingLabel controlId='floatingNotes' label="Additional Notes" className="mb-3">
                            <Form.Control
                                as="textarea"
                                placeholder="Additional Notes"
                                style={{ height: '100px' }}
                                name="notes"
                                value={appData.notes || ""}
                                onChange={handleChange}
                            />
                        </FloatingLabel>
                    </Modal.Body>
                    <Modal.Footer>
                        {mode === "edit" && (<Button
                            type="button"
                            variant="danger"
                            onClick={() => deleteApplication(appData.id)}
                        >
                            Delete
                        </Button>)}
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                        >
                            Submit
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <div className="application-table">
                <Table hover responsive style={{ tableLayout: "fixed", width: "100%", minWidth: "900px" }}>
                    <thead>
                        <tr key="header">
                            {tableVisibleFields.map((field) => (
                                <th 
                                    className="text-capitalize" 
                                    scope="col" 
                                    key={`header-${field.field_name}`}
                                    style={{ width: field.width }}
                                >
                                    {field.field_name === 'platform_template' ? "Platform" : field.field_name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {apps.map((app) => (
                            <tr key={app.id}>
                                {tableVisibleFields.map((field) => (
                                    <td 
                                        key={`${app.id}-${field.field_name}`}
                                        style={field.field_name === "name" ? { position: "relative" } : undefined}
                                    >
                                        {field.type === "text" ? (
                                            <>
                                            <EditableInput
                                                value={app[field.field_name]}
                                                onSave={(newValue) => {
                                                    updateField(app.id, field.field_name, newValue);
                                                }}
                                                customWidth={field.field_name === "name" ? "80%": "100%"}
                                            />
                                            {field.field_name === "name" && (
                                                <Button
                                                    size='sm'
                                                    className="edit-btn"
                                                    type="button"
                                                    variant='outline-secondary'
                                                    onClick={() => {
                                                        setMode("edit");
                                                        setAppData(app);
                                                        setShowModal(true);
                                                    }}
                                                >
                                                    Edit
                                                </Button>
                                            )}
                                            </>
                                        ) : field.type === 'select' ? (
                                            <EditableSelect 
                                                value={app[field.field_name]}
                                                field_name={field.field_name}
                                                options={
                                                    field.field_name === 'status' ? statusOptions
                                                    : field.field_name === 'category' ? categoryOptions
                                                    : field.field_name === 'platform_template' ? platformOptions
                                                    : []
                                                }
                                                onSave={(newValue) => {
                                                    updateField(app.id, field.field_name, newValue);
                                                }}
                                            />
                                        ) : (
                                            <EditableTextArea
                                                value={app[field.field_name]}
                                                onSave={(newValue) => {
                                                    updateField(app.id, field.field_name, newValue);
                                                }}
                                            />
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
}

export default ApplicationList;