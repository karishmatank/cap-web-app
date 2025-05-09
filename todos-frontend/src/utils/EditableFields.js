import { useEffect, useState, useRef } from 'react';
import React from "react";
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import "react-day-picker/dist/style.css";

export function EditableInput({ value, onSave, customWidth }) {
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

export function EditableSelect({ value, field_name, options, onSave }) {
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
        if (field_name === 'platform_template') {
            const foundItem = list.find((item) => item['id'] === key);
            return foundItem?.['name'] ?? null;
        } else {
            const foundItem = list.find((item) => item['value'] === key);
            return foundItem?.['label'] ?? null;
        }
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
            {isEditing && field_name === "platform_template" ? (
                <ul className="list-group position-absolute shadow" style={{ zIndex: 10 }}>
                    {options.map((option) => (
                        <li
                            key={option.id}
                            onClick={() => {
                                saveChanges(parseInt(option.id));
                                setIsEditing(false);
                            }}
                            style={{ cursor: "pointer" }}
                            className="list-group-item list-group-item-action d-flex align-items-center gap-2"
                        >
                            <span className={`badge rounded-pill text-bg-${getBadgeColor(option.name, field_name)}`}>
                                {option.name}
                            </span>
                        </li>
                    ))}
                </ul>
            ): isEditing ? (
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

export function EditableTextArea({ value, onSave }) {
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

    useEffect(() => {
        if (!isEditing) {
            setDraft(value);
        }
    }, [value, isEditing]);

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
            {value || <i className="placeholder-text">Click to add notes</i>}
        </div>
    );
}

export function EditableDate({ value, onSave }) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const datePickerRef = useRef(null);
    const calendarRef = useRef(null);
    const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });

    // const handleFocus = () => {
    //     if (datePickerRef.current) {
    //         datePickerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    //     }
    // };

    const saveChanges = (date) => {
        // react-datepicker itself calls this function and directly passes in the new Date object
        setDraft(date);

        const formattedDate = date.getFullYear() + "-" +
            String(date.getMonth() + 1).padStart(2, "0") + "-" +
            String(date.getDate()).padStart(2, "0");
        
        console.log(formattedDate);

        onSave(formattedDate);
        setIsEditing(false);
    };

    useEffect(() => {
        if (!isEditing) {
            setDraft(value ? new Date(value) : null);
        }
    }, [value, isEditing]);

    const openCalendar = () => {
        if (datePickerRef.current) {
            const rect = datePickerRef.current.getBoundingClientRect();
            setCalendarPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
            });
        }
        setIsEditing(true);
    };

    // Collapse calendar if user clicks away
    const handleClickOutside = (event) => {
        if (calendarRef.current && !calendarRef.current.contains(event.target)) {
            setIsEditing(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div ref={datePickerRef} style={{ position: "relative", cursor: "pointer", width: "100%", height: "100%" }}>
            <span
                onClick={openCalendar}
                className='form-control editable-input'
            >
                {draft ? draft.toLocaleDateString() : <i className="placeholder-text" style={{ color: "#ff4545" }}>Click to set due date</i>}
            </span>
            {isEditing && createPortal(
                <div ref={calendarRef} style={{
                    position: 'absolute',
                    top: `${calendarPosition.top}px`,
                    left: `${calendarPosition.left}px`,
                    zIndex: 2000,
                    background: 'white',
                    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.15)',
                    borderRadius: '0.5rem',
                    marginTop: '4px',
                }}>
                    <DayPicker
                        mode="single"
                        selected={draft}
                        onSelect={(date) => saveChanges(date)}
                        timezone="America/New_York"
                        defaultMonth={draft ? new Date(draft.getFullYear(), draft.getMonth()) : undefined}
                    />
                </div>,
                document.body
            )}
        </div>
    );
}