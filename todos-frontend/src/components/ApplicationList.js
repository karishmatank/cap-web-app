import axios from '../utils/axios';
import { useEffect, useState, React, useRef } from 'react';
import { Modal, Button, Form, FloatingLabel, Table} from 'react-bootstrap';

function EditableInput({ value, onSave, customWidth }) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(value);

    const saveChanges = () => {
        setIsEditing(false);
        onSave(draft);
    }

    return isEditing ? (
        <input
            type="text"
            value={draft}
            autoFocus
            onChange={(event) => setDraft(event.target.value)}
            onBlur={saveChanges}
            onKeyDown={(event) => {
                if (event.key === "Enter") saveChanges();
                if (event.key === "Escape") {
                    setDraft(value);
                    setIsEditing(false);
                }
            }}
            className="form-control form-control-sm editable-input"
            style={{ width: customWidth }}
        />
    ) : (
        <div 
            onClick={(event) => {
                // Make sure multiple clicks inside the input / textarea don't re-enter edit mode or trigger unwanted behavior
                if (event.target.tagName !== "TEXTAREA" && event.target.tagName !== "INPUT") {
                    setIsEditing(true);
                }
            }} 
            style={{ cursor: "pointer", width: customWidth, height: "100%" }}
            className="editable-text"
        >
            {value}
        </div>
    );
}

function EditableSelect({ value, field_name, options, onSave }) {
    const [isEditing, setIsEditing] = useState(false);
    const containerRef = useRef(null);

    const getBadgeColor = (value, field_name) => {
        if (value === "in_progress" && field_name === "status") return "secondary";
        if (value === "submitted" && field_name === "status") return "success";
        if (field_name === "category") return "info";
        if (field_name === "school") return "primary";

        return "light";
    };

    const saveChanges = (newValue) => {
        onSave(newValue);
    };

    const findValueByKey = (key, list) => {
        const foundItem = list.find((item) => item['value'] === key);
        return foundItem?.['label'] ?? null;
    };

    // If we click outside the container, stop editing
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsEditing(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef}>
            {isEditing ? (
                <ul className="list-group position-absolute shadow" style={{ zIndex: 10 }}>
                    {options.map((option) => (
                        <li
                            key={option.value}
                            onClick={() => {
                                saveChanges(option.value);
                                setIsEditing(false);
                            }}
                            style={{ cursor: "pointer" }}
                            className="list-group-item list-group-item-action d-flex align-items-center gap-2"
                        >
                            <span className={`badge rounded-pill text-bg-${getBadgeColor(option.value, field_name)}`}>
                                {option.label}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div 
                    className={`badge rounded-pill text-bg-${getBadgeColor(value, field_name)} text-capitalize`} 
                    onClick={() => setIsEditing(true)} 
                    style={{ cursor: "pointer", width: "100%", height: "100%" }}
                >
                    {findValueByKey(value, options) || "Not set"}
                </div>
            )}
        </div>
    );
}

function EditableTextArea({ value, onSave }) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const textAreaRef = useRef(null);

    const saveChanges = () => {
        setIsEditing(false);
        onSave(draft);
    }

    // Automatically move cursor to end when we are editing
    useEffect(() => {
        if (isEditing && textAreaRef.current) {
            const el = textAreaRef.current;
            el.focus();
            el.selectionStart = el.selectionEnd = el.value.length;
        }
    }, [isEditing]);

    // Autoresize text area as user is typing
    const autoResize = () => {
        const el = textAreaRef.current;
        console.log("Auto resizing!", el?.scrollHeight);
        if (el) {
            el.style.height = "auto"; // Reset height to shrink if needed
            el.style.height = `${el.scrollHeight}px`; // Expand to fit content
        }
    };

    useEffect(() => {
        if (isEditing) {
            // Wait until DOM paints before we calculate scrollHeight
            requestAnimationFrame(() => {
                autoResize();
            });
        }
    }, [isEditing]);

    return isEditing ? (
        <textarea
            ref={textAreaRef}
            style={{ overflow: "hidden", resize:"none" }}
            autoFocus
            onChange={(event) => {
                setDraft(event.target.value);
                autoResize();
            }}
            onBlur={saveChanges}
            onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault(); // Prevent newline unless we have a shift present
                    saveChanges();
                }
                if (event.key === "Escape") {
                    setDraft(value);
                    setIsEditing(false);
                }
            }}
            className="editable-input"
            value={draft}
            rows={1}
        >
            {draft}
        </textarea>
    ) : (
        <div 
            onClick={(event) => {
                // Make sure multiple clicks inside the input / textarea don't re-enter edit mode or trigger unwanted behavior
                if (event.target.tagName !== "TEXTAREA" && event.target.tagName !== "INPUT") {
                    setIsEditing(true);
                }
            }} 
            style={{ cursor: "pointer", width: "100%", height: "100%" }}
        >
            {value}
        </div>
    );
}

function ApplicationList() {
    const [apps, setApps] = useState([]);
    const [appData, setAppData] = useState({});
    const tableVisibleFields = [
        {'field_name': 'status', 'type': 'select', 'width': '10%'}, 
        {'field_name': 'name', 'type': 'text', 'width': '30%'}, 
        {'field_name': 'category', 'type': 'select', 'width': '10%'}, 
        {'field_name': 'platform', 'type': 'select', 'width': '10%'},
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

        axios.get("/tasks/api/applications/platform_choices/")
        .then((response) => {
            setPlatformOptions(response.data);
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
        setAppData((prev) => ({
            ...prev,
            [event.target.name]: event.target.value
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

    // Update a specific field inline in table
    const updateField = (id, field, value) => {
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
        <div className="application-list-content container mt-4">
            <div className="application-create d-flex justify-content-between align-items-center mb-3">
                <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={() => {
                        setMode("create");
                        setShowModal(true);
                    }}
                >
                    + Add Application
                </Button>
            </div>

            {/* Modal for form that contains the fields we need to create a new application entry */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Form 
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
                        <FloatingLabel controlId='floatingCategory' label="Category" className="mb-3">
                            <Form.Select name="category" value={appData.category || ""} onChange={handleChange} required>
                                <option value="" disabled>Select a category</option>
                                {categoryOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </FloatingLabel>
                        <FloatingLabel controlId='floatingName' label="Application Name" className="mb-3">
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
                            <FloatingLabel controlId='floatingPlatform' label="Platform, If Applicable" className="mb-3">
                                <Form.Select name="platform" value={appData.platform || ""} onChange={handleChange}>
                                    <option value="">Select a platform</option>
                                    {platformOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
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
                <Table hover responsive style={{ tableLayout: "fixed", width: "100%" }}>
                    <thead>
                        <tr key="header">
                            {tableVisibleFields.map((field) => (
                                <th 
                                    className="text-capitalize" 
                                    scope="col" 
                                    key={`header-${field.field_name}`}
                                    style={{ width: field.width }}
                                >
                                    {field.field_name}
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
                                                    : field.field_name === 'platform' ? platformOptions
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