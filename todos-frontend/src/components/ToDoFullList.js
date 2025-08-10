import axios from '../utils/axios';
import { useEffect, useState, React, useRef, useCallback } from 'react';
import { Modal, Button, Form, FloatingLabel, Table, Accordion, Dropdown, DropdownButton, Popover, OverlayTrigger } from 'react-bootstrap';
import { EditableInput, EditableSelect, EditableTextArea, EditableDate } from '../utils/EditableFields';
import { DayPicker } from 'react-day-picker';
import "react-day-picker/dist/style.css";

function ToDoFullList({ currentUser }) {
    const [mode, setMode] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [toDoData, setToDoData] = useState({});
    const [toDos, setToDos] = useState([]);
    const tableVisibleFields = [
        {'field_name': 'completed', 'type': 'checkbox', 'width': '5%'}, 
        {'field_name': 'name', 'type': 'text', 'width': '30%'}, 
        {'field_name': 'due', 'type': 'date', 'width': '15%'},
        {'field_name': 'application', 'type': 'select', 'width': '20%'},
        {'field_name': 'description', 'type': 'textarea', 'width': '30%'}
    ];
    const [applicationOptions, setApplicationOptions] = useState([]);
    const [tagOptions, setTagOptions] = useState([]);
    const datePickerRef = useRef(null);
    const [menteeOptions, setMenteeOptions] = useState([]);
    const [allUsersToDos, setAllUsersToDos] = useState([]);
    const [selectedMenteeName, setSelectedMenteeName] = useState("");
    const [filteredToDos, setFilteredToDos] = useState([]);
    const [selectedApplications, setSelectedApplications] = useState([]);
    const [selectedCompleted, setSelectedCompleted] = useState([false]);

    const completedOptions = [{ value: true, label: "Completed" }, { value: false, label: "Outstanding" }];

    // Get application options specific to the user
    useEffect(() => {
        axios.get(`/tasks/api/todos/application_choices/`)
        .then((response) => {
            setApplicationOptions(response.data);
            setSelectedApplications(response.data.map((item) => item.value));
        })
        .catch((error) => {
            console.error("Error fetching application options", error);
        });

        axios.get(`/tasks/api/todos/tag_choices/`)
        .then((response) => {
            setTagOptions(response.data);
        })
        .catch((error) => {
            console.error("Error fetching tag options", error);
        });
    }, []);

    const fetchToDos = useCallback(() => {
        axios.get(`/tasks/api/todos/`)
        .then((response) => {
            // Tags will come as a string, need to split into an array
            const transformedToDos = response.data.map((todo) => ({
                ...todo,
                tags: todo.tags ? todo.tags.split(",") : []
            }));

            if (currentUser?.role === 'mentee') {
                setToDos(transformedToDos);
                setFilteredToDos(transformedToDos);
            } else {
                setAllUsersToDos(transformedToDos);
            }
        })
        .catch((error) => {
            console.error("Error getting to dos", error);
        });
    }, [currentUser]);

    useEffect(() => {
        fetchToDos();
    }, [fetchToDos]);

    // Create a list of unique users within apps. If mentee, there should only be themselves
    useEffect(() => {
        const mentees = allUsersToDos.map((todo) => todo.user);
        const unique_mentees = [...new Map(mentees.map(item => [item.id, item])).values()];
        setMenteeOptions(unique_mentees);
    }, [allUsersToDos]);

    // If user is a mentor or admin, if they select a mentee, show their app data
    const filterMentee = (id) => {
        const mentee_todos = allUsersToDos.filter((app) => app.user.id === id);
        setToDos(mentee_todos);
        setFilteredToDos(mentee_todos);

        const selected = menteeOptions.find(m => m.id === id);
        setSelectedMenteeName(`${selected.first_name} ${selected.last_name}`);
    };

    // If a user filtered by a certain column's values, show only those to dos
    const filterColumn = (event, field, option) => {
        // Update selected filters array for field + filter to dos
        const updater = (prev, key) => {
            const value = key === "id" ? option.id : option.value;

            if (event.target.checked) {
                return prev.includes(value) ? prev : [...prev, value];
            } else {
                return prev.filter((item) => item !== value);
            }
        }

        if (field === "application") {
            setSelectedApplications((prev) => updater(prev, "value"));
        } else {
            setSelectedCompleted((prev) => updater(prev, "value"));
        }
    };

    // Need to update filtered apps list in a separate useEffect rather than in filterColumn b/c otherwise 
    // it will use the old state of selectedApplication and co
    useEffect(() => {
        const new_filtered_to_dos = toDos.filter((item) => selectedApplications.includes(item.application) &&
                                                           selectedCompleted.includes(item.completed));
        setFilteredToDos(new_filtered_to_dos);
    }, [toDos, selectedApplications, selectedCompleted]);

    const filterDropdown = (field_name, filterOptions, selectedFilters) => {
        
        const popover = (
            <Popover id={`popover-${field_name}`}>
                <Popover.Body style={{ overflowY: "auto", padding: "10px" }}>
                    {filterOptions.map(option => {
                        // Because Form.Check automatically converts the value (option.value) to a string, we can't do
                        // checked={selectedFilters.includes(option.value)} because that tries to check "true" vs true (bool)
                        const value = option.value ?? option.id; // This is still boolean
                        const isChecked = selectedFilters.includes(value);

                        return (
                            <Form.Check 
                                key={value.toString()}
                                type="checkbox"
                                label={option.label ?? option.name}
                                value={value}
                                checked={isChecked}
                                onChange={(event) => filterColumn(event, field_name, option)}
                            />
                        );
                    })}
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
                {field_name === "application" ? (
                    <Button 
                        variant="light" 
                        size="sm" 
                        className="p-1 ms-2" 
                        style={{ lineHeight: 1 }}
                    >
                        <i className="bi bi-funnel-fill"></i>
                    </Button>
                ) : (
                    <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        className="p-1" 
                        style={{ lineHeight: 1 }}
                    >
                        <span>✅</span>
                    </Button>
                )}
            </OverlayTrigger>
        );
    };

    const createToDo = (event) => {
        // Prevent a full page reload by preventing default behavior. We handle the form ourselves
        event.preventDefault();

        // Convert tags from array to string for Django CharField
        const payload = {
            ...toDoData,
            tags: toDoData.tags.join(','),
        };

        axios.post(`/tasks/api/todos/`, payload)
        .then((response) => {
            console.log("New to do created", response.data);
            setMode("");
            setToDoData({});
            fetchToDos();
            setShowModal(false);
        })
        .catch((error) => {
            console.error("Error creating to do", error);
        });
    };

    const editToDo = (event, id) => {
        // Prevent a full page reload by preventing default behavior. We handle the form ourselves
        event.preventDefault();

        // Convert tags from array to string for Django CharField
        const payload = {
            ...toDoData,
            tags: toDoData.tags.join(','),
        };

        axios.put(`/tasks/api/todos/${id}/`, payload)
        .then((response) => {
            console.log("To do edited", response.data);
            setMode("");
            setToDoData({});
            fetchToDos();
            setShowModal(false);
        })
        .catch((error) => {
            console.error("Error editing to do", error);
        });
    };

    // Delete application
    const deleteToDo = (id) => {
        axios.delete(`/tasks/api/todos/${id}/`)
        .then((response) => {
            console.log("To do deleted", response.data);
            setMode("");
            setToDoData({});
            fetchToDos();
            setShowModal(false);
        })
        .catch((error) => {
            console.error("Error deleting to do", error);
        });
    };

    const updateField = (id, field, value) => {
        // Update to do list first so it looks like a seamless update on the table
        setToDos((prevToDos) => 
            prevToDos.map((todo) => 
                todo.id === id ? {...todo, [field]: value} : todo
            )
        );

        axios.patch(`/tasks/api/todos/${id}/`, {
            [field]: value
        })
        .then((response) => {
            console.log("To do field updated", response.data);
            fetchToDos();
        })
        .catch((error) => {
            console.error("Error modifying to do", error);
        });
    };

    // Handle change when input in the form is edited / created
    const handleChange = (event) => {
        setToDoData((prev) => ({
            ...prev, [event.target.name]: event.target.value
        }));
    };

    const handleDateChange = (date) => {
        if (!date) {
            setToDoData((prev) => ({
                ...prev, 
                due_date: null
            }));

            return;
        }

        const formattedDate = date.getFullYear() + "-" +
            String(date.getMonth() + 1).padStart(2, "0") + "-" +
            String(date.getDate()).padStart(2, "0");
        
        setToDoData((prev) => ({
            ...prev, 
            due_date: formattedDate
        }));
    };

    const handleTagCheckboxChange = (event) => {
        setToDoData((prev) => ({
            ...prev,
            tags: event.target.checked 
                ? [...(prev.tags || []), event.target.value] 
                : (prev.tags || []).filter((tag) => tag !== event.target.value)
        }));
    };

    // const handleFocus = () => {
    //     if (datePickerRef.current) {
    //         datePickerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    //     }
    // };

    const parseDateFromString = (dateString) => {
        if (!dateString) return undefined;
        const [year, month, day] = dateString.split("-").map(Number);
        return new Date(year, month - 1, day); // month is zero indexed
    };

    const getBadgeColor = (value, field_name) => {
        if (value === "in_progress" && field_name === "status") return "secondary";
        if (value === "submitted" && field_name === "status") return "success";
        if (field_name === "category") return "info";
        if (field_name === "school") return "primary";

        return "light";
    };

    const getLabel = (field, value) => {
        if (field === "application") {
            return applicationOptions.find((option) => option.value === value).label;
        }
        
        return "";
    };

    return (
        <div className="todo-full-list-content container">
            <div className="todo-create d-flex justify-content-between align-items-center mb-3">
                <div className="mt-4">
                    {currentUser?.role === "mentee" ? (
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => {
                                setMode("create");
                                setToDoData({});
                                setShowModal(true);
                            }}
                        >
                            + Add To Do
                        </Button>
                    ) : (
                        <DropdownButton 
                            id="select-user-dropdown" 
                            title={selectedMenteeName || "Select Mentee"} 
                            onSelect={(eventKey) => {
                                filterMentee(eventKey);
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
            
            {/* Modal for form that contains the fields we need to create a new to do entry */}
            <Modal 
                show={showModal} 
                onHide={() => setShowModal(false)}
                size="lg"
            >
                <Form
                    className="modal-form" 
                    onSubmit={(event) => {
                        if (mode === "create") {
                            createToDo(event);
                        } else {
                            editToDo(event, toDoData.id);
                        }
                    }}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>{mode === "create" ? "Add New To Do" : "Edit To Do"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <FloatingLabel controlId='floatingName' label="To Do Name" className="mb-3 form-field">
                            <Form.Control 
                                type="text"
                                name="name"
                                placeholder="To Do Name"
                                value={toDoData.name || ""}
                                onChange={handleChange}
                                required
                                disabled={currentUser?.role !== "mentee"}
                            />
                        </FloatingLabel>
                        <FloatingLabel controlId='floatingAppName' label="Application" className="mb-3 form-field">
                            <Form.Select 
                                name="application" 
                                value={toDoData.application || ""} 
                                onChange={handleChange} 
                                required 
                                disabled={currentUser?.role !== "mentee"}
                            >
                                <option value="" disabled>For Application:</option>
                                {applicationOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </FloatingLabel>
                        <Form.Group controlId='floatingDueDate' className="mb-3 form-field">
                            <Form.Label>Due Date <span role="img" aria-label="calendar">📅</span></Form.Label>
                            <div ref={datePickerRef} className="responsive-calendar">
                                <DayPicker
                                    selected={toDoData.due_date ? parseDateFromString(toDoData.due_date) : null}
                                    onSelect={(date) => handleDateChange(date)}
                                    mode="single"
                                    className="form-control"
                                    defaultMonth={toDoData.due_date ? parseDateFromString(toDoData.due_date) : undefined}
                                    disabled={currentUser?.role !== "mentee"}
                                />
                            </div>
                        </Form.Group>
                        <Form.Group controlId='floatingTags' className="mb-3 form-field">
                            <Accordion alwaysOpen>
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header>
                                        {`Select Tags${toDoData.tags && toDoData.tags.length > 0 ? ` (${toDoData.tags.length})` : ""}`}
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        {tagOptions.map((option) => (
                                            <Form.Check 
                                                key={option.value}
                                                type="checkbox"
                                                id={`tag-${option.value}`}
                                                value={option.value}
                                                label={option.label}
                                                checked={toDoData.tags?.includes(option.value) || false}
                                                onChange={handleTagCheckboxChange}
                                                disabled={currentUser?.role !== "mentee"}
                                            />
                                        ))}
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                        </Form.Group>
                        <FloatingLabel controlId='floatingDescription' label="Description" className="mb-3">
                            <Form.Control
                                as="textarea"
                                placeholder="Description"
                                style={{ height: '100px' }}
                                name="description"
                                value={toDoData.description || ""}
                                onChange={handleChange}
                                disabled={currentUser?.role !== "mentee"}
                            />
                        </FloatingLabel>
                    </Modal.Body>
                    <Modal.Footer>
                        {mode === "edit" && (<Button
                            type="button"
                            variant="danger"
                            onClick={() => deleteToDo(toDoData.id)}
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

            <div className="todo-table">
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
                                    {field.field_name === "completed" ? "" : field.field_name}

                                    {["application", "completed"].includes(field.field_name) && (
                                        field.field_name === "completed" ? filterDropdown("completed", completedOptions, selectedCompleted) :
                                        filterDropdown("application", applicationOptions, selectedApplications)
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>    
                        {filteredToDos.map((todo) => (
                            <tr key={todo.id}>
                                {tableVisibleFields.map((field) => (
                                    <td 
                                        key={`${todo.id}-${field.field_name}`}
                                        style={field.field_name === "name" ? { position: "relative" } : undefined}
                                    >
                                        {field.type === "text" ? (
                                            currentUser?.role === "mentee" ? (
                                                <>
                                                <EditableInput
                                                    value={todo[field.field_name]}
                                                    onSave={(newValue) => {
                                                        updateField(todo.id, field.field_name, newValue);
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
                                                            setToDoData(todo);
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
                                                    {todo[field.field_name]}
                                                </span>
                                                {field.field_name === "name" && (
                                                    <Button
                                                        size='sm'
                                                        className="edit-btn"
                                                        type="button"
                                                        variant='outline-secondary'
                                                        onClick={() => {
                                                            setToDoData(todo);
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
                                                    value={todo[field.field_name]}
                                                    field_name={field.field_name}
                                                    options={
                                                        field.field_name === 'application' ? applicationOptions
                                                        : []
                                                    }
                                                    onSave={(newValue) => {
                                                        updateField(todo.id, field.field_name, newValue);
                                                    }}
                                                />
                                            ) : (
                                                <span 
                                                    className={`badge rounded-pill text-bg-${getBadgeColor(todo[field.field_name], field.field_name)}`}
                                                    style={{ width: "100%", height: "100%" }}
                                                >
                                                    {getLabel(field.field_name, todo[field.field_name])}
                                                </span>
                                            )
                                        ) : field.type === 'textarea' ? (
                                            currentUser?.role === "mentee" ? (
                                                <EditableTextArea
                                                    value={todo[field.field_name]}
                                                    onSave={(newValue) => {
                                                        updateField(todo.id, field.field_name, newValue);
                                                    }}
                                                />
                                            ) : (
                                                <span style={{ width: "100%", height: "100%" }}>
                                                    {todo[field.field_name]}
                                                </span>
                                            )
                                        ) : field.type === 'checkbox' ? (
                                            currentUser?.role === "mentee" ? (
                                                <input 
                                                    type="checkbox"
                                                    checked={todo[field.field_name]}
                                                    onChange={(event) => {
                                                        updateField(todo.id, field.field_name, event.target.checked);
                                                    }} 
                                                />
                                            ) : (
                                                <input type="checkbox" checked={todo[field.field_name]} />
                                            )
                                        ) : (
                                            currentUser?.role === "mentee" ? (
                                                <EditableDate 
                                                    value={field.field_name === "due" ? 
                                                        parseDateFromString(todo["due_date"]) : 
                                                        parseDateFromString(todo[field.field_name])
                                                    }
                                                    onSave={(newValue) => {field.field_name === "due" ?
                                                        updateField(todo.id, "due_date", newValue) :
                                                        updateField(todo.id, field.field_name, newValue);
                                                    }}
                                                />
                                            ) : (
                                                <span style={{ width: "100%", height: "100%" }}>
                                                    {todo[field.field_name === "due" ? "due_date" : field.field_name]}
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

export default ToDoFullList;