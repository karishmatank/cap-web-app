import { useEffect, useState, React, useRef } from 'react';

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