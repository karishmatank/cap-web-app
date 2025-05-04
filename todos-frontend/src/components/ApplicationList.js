import axios from '../utils/axios';
import { useEffect, useState, React, useCallback } from 'react';
import { Modal, Button, Form, FloatingLabel, Table, Dropdown, DropdownButton, OverlayTrigger, Popover } from 'react-bootstrap';
import { EditableInput, EditableSelect, EditableTextArea } from '../utils/EditableFields';

function ApplicationList({ currentUser }) {
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
    const [menteeOptions, setMenteeOptions] = useState([]);
    const [allUsersApps, setAllUsersApps] = useState([]);
    const [selectedMenteeName, setSelectedMenteeName] = useState("");
    const [filteredApps, setFilteredApps] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);

    // Get category and platform choices to use for the form
    useEffect(() => {
        axios.get("/tasks/api/applications/category_choices/")
        .then((response) => {
            setCategoryOptions(response.data);
            setSelectedCategories(response.data.map((item) => item.value));
        })
        .catch((error) => {
            console.error("Error retrieving application categories", error);
        });

        axios.get("/tasks/api/platform-registrations/")
        .then((response) => {
            const extractedOptions = response.data.map((item) => item.platform_template);
            setPlatformOptions(extractedOptions);
            setSelectedPlatforms(extractedOptions.map((item) => item.id));
        })
        .catch((error) => {
            console.error("Error retrieving application school platforms", error);
        });

        axios.get("/tasks/api/applications/status_choices/")
        .then((response) => {
            setStatusOptions(response.data);
            setSelectedStatuses(response.data.map((item) => item.value));
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

    const fetchApplications = useCallback(() => {
        axios.get("/tasks/api/applications/")
        .then((response) => {
            // For mentors and admin, they'll receive more than one user's app
            // Mentees will just receive their apps
            if (currentUser?.role === 'mentee') {
                setApps(response.data);
                setFilteredApps(response.data);
            } else {
                setAllUsersApps(response.data);
            }
        })
        .catch((error) => {
            console.error("Error retrieving user apps", error);
        });
    }, [currentUser]);

    // Get all applications that the user has started when they view the page
    // We already filter for the current user in our API view
    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    // Create a list of unique users within apps. If mentee, there should only be themselves
    useEffect(() => {
        const mentees = allUsersApps.map((app) => app.user);
        const unique_mentees = [...new Map(mentees.map(item => [item.id, item])).values()];
        setMenteeOptions(unique_mentees);
    }, [allUsersApps]);

    // If user is a mentor or admin, if they select a mentee, show their app data
    const filterMentee = (id) => {
        const mentee_apps = allUsersApps.filter((app) => app.user.id === id);
        setApps(mentee_apps);
        setFilteredApps(mentee_apps);

        const selected = menteeOptions.find(m => m.id === id);
        setSelectedMenteeName(`${selected.first_name} ${selected.last_name}`);
    };

    // If a user filtered by a certain column's values, show only those apps
    const filterColumn = (event, field, option) => {
        // Update selected filters array for field + filter apps
        const updater = (prev, key) => {
            const value = key === "id" ? option.id : option.value;

            if (event.target.checked) {
                return prev.includes(value) ? prev : [...prev, value];
            } else {
                return prev.filter((item) => item !== value);
            }
        }

        if (field === "status") {
            setSelectedStatuses((prev) => updater(prev, "value"));
        } else if (field === "category") {
            setSelectedCategories((prev) => updater(prev, "value"));
        } else {
            setSelectedPlatforms((prev) => updater(prev, "id"));
        }
    };
    
    // Need to update filtered apps list in a separate useEffect rather than in filterColumn b/c otherwise 
    // it will use the old state of selectedStatus and co
    useEffect(() => {
        const new_filtered_apps = apps.filter((item) => selectedStatuses.includes(item.status) && 
                                                        selectedCategories.includes(item.category) &&
                                                        selectedPlatforms.includes(item.platform_template));
        setFilteredApps(new_filtered_apps);
    }, [apps, selectedStatuses, selectedCategories, selectedPlatforms]);

    const filterDropdown = (field_name, filterOptions, selectedFilters) => {

        const popover = (
            <Popover id={`popover-${field_name}`}>
                <Popover.Body style={{ overflowY: "auto", padding: "10px" }}>
                    {filterOptions.map(option => (
                        <Form.Check 
                            key={option.value ? option.value : option.id}
                            type="checkbox"
                            label={option.label ? option.label : option.name}
                            value={option.value ? option.value : option.id}
                            checked={selectedFilters.includes(option.value ? option.value : option.id)}
                            onChange={(event) => filterColumn(event, field_name, option)}
                        />
                    ))}
                </Popover.Body>
            </Popover>
        );

        return (
            <OverlayTrigger
                trigger="click"
                placement="bottom"
                overlay={popover}
                rootClose
            >
                <Button 
                    variant="light" 
                    size="sm" 
                    className="p-1 ms-2" 
                    style={{ lineHeight: 1 }}
                >
                    <i className="bi bi-funnel-fill"></i>
                </Button>
            </OverlayTrigger>
        );
    };

    const getBadgeColor = (value, field_name) => {
        if (value === "in_progress" && field_name === "status") return "secondary";
        if (value === "submitted" && field_name === "status") return "success";
        if (field_name === "category") return "info";
        if (field_name === "school") return "primary";

        return "light";
    };

    const getLabel = (field, value) => {
        if (field === "status") {
            return statusOptions.find((option) => option.value === value).label;
        } else if (field === "category") {
            return categoryOptions.find((option) => option.value === value).label;
        } else if (field === "platform_template") {
            return platformOptions.find((option) => parseInt(option.id) === parseInt(value)).name;
        } 
        
        return "";
    };

    return (
        <div className="application-list-content container">
            <div className="application-create d-flex justify-content-between align-items-center mb-3">
                <div className="mt-4">
                    {currentUser?.role === "mentee" ? (
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
                    ) : (
                        <DropdownButton 
                            id="select-user-dropdown" 
                            title={selectedMenteeName || "Select Mentee"} 
                            onSelect={(eventKey) => {
                                filterMentee(parseInt(eventKey));
                            }}
                            variant="primary"
                        >
                            {menteeOptions.map((mentee) => (
                                <Dropdown.Item key={mentee.id} eventKey={mentee.id}>
                                    {mentee.first_name} {mentee.last_name}
                                </Dropdown.Item>
                            ))}
                        </DropdownButton>
                    )}
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
                        <Modal.Title>
                            {mode === "create" ? "Add New Application" : "Edit Application"}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <FloatingLabel controlId='floatingCategory' label="Category" className="mb-3 form-field">
                            <Form.Select 
                                name="category" 
                                value={appData.category || ""} 
                                onChange={handleChange} 
                                required
                                disabled={currentUser?.role !== "mentee"}
                            >
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
                                disabled={currentUser?.role !== "mentee"}
                            />
                        </FloatingLabel>
                        {appData.category === 'school' && (
                            <FloatingLabel controlId='floatingPlatform' label="Platform, If Applicable" className="mb-3 form-field">
                                <Form.Select 
                                    name="platform_template" 
                                    value={appData.platform_template || ""} 
                                    onChange={handleChange}
                                    disabled={currentUser?.role !== "mentee"}
                                >
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
                                disabled={currentUser?.role !== "mentee"}
                            />
                        </FloatingLabel>
                    </Modal.Body>
                    <Modal.Footer>
                        {mode === "edit" && (<Button
                            type="button"
                            variant="danger"
                            onClick={() => deleteApplication(appData.id)}
                            disabled={currentUser?.role !== "mentee"}
                        >
                            Delete
                        </Button>)}
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowModal(false)}
                            disabled={currentUser?.role !== "mentee"}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={currentUser?.role !== "mentee"}
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

                                    {["status", "category", "platform_template"].includes(field.field_name) && (
                                        field.field_name === "status" ? filterDropdown("status", statusOptions, selectedStatuses) :
                                        field.field_name === "category" ? filterDropdown("category", categoryOptions, selectedCategories) :
                                        filterDropdown("platform_template", platformOptions, selectedPlatforms)
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredApps.map((app) => (
                            <tr key={app.id}>
                                {tableVisibleFields.map((field) => (
                                    <td 
                                        key={`${app.id}-${field.field_name}`}
                                        style={field.field_name === "name" ? { position: "relative" } : undefined}
                                    >
                                        {field.type === "text" ? (
                                            currentUser?.role === "mentee" ? (
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
                                            ) : (
                                                <>
                                                <span style={{ width: field.field_name === "name" ? "80%": "100%", height: "100%", display: "block" }}>
                                                    {app[field.field_name]}
                                                </span>
                                                {field.field_name === "name" && (
                                                    <Button
                                                        size='sm'
                                                        className="edit-btn"
                                                        type="button"
                                                        variant='outline-secondary'
                                                        onClick={() => {
                                                            setAppData(app);
                                                            setShowModal(true);
                                                        }}
                                                    >
                                                        Open
                                                    </Button>
                                                )}
                                                </>
                                            )
                                        ) : field.type === 'select' ? (
                                            currentUser?.role === "mentee" ? (
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
                                                <span 
                                                    className={`badge rounded-pill text-bg-${getBadgeColor(app[field.field_name], field.field_name)}`}
                                                    style={{ width: "100%", height: "100%" }}
                                                >
                                                    {getLabel(field.field_name, app[field.field_name])}
                                                </span>
                                            )  
                                        ) : (
                                            currentUser?.role === "mentee" ? (
                                                <EditableTextArea
                                                    value={app[field.field_name]}
                                                    onSave={(newValue) => {
                                                        updateField(app.id, field.field_name, newValue);
                                                    }}
                                                />
                                            ) : (
                                                <span style={{ width: "100%", height: "100%" }}>
                                                    {app[field.field_name]}
                                                </span>
                                            )
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