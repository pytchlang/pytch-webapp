import React, { useState } from "react"
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";

import { useStoreActions, useStoreState } from "../store";

export const CreateProjectModal = () => {
    const modalName = "create-project";

    const [name, setName] = useState("");

    const isShowing = useStoreState(state => state.modals.isShowing.get(modalName));
    const { hide, create } = useStoreActions(actions => ({
        hide: actions.modals.hide,
        create: actions.projectCollection.createNewProject,
     }));

    console.log("show?", isShowing);
    const handleCreate = async () => {
        console.log("creating project", name);
        create(name);
        hide(modalName);
    }

    const handleChange = (evt: any) => { setName(evt.target.value); }
    const handleClose = () => { hide(modalName); }

    return (
        <Modal
            show={isShowing}
            onHide={handleClose}
            animation={false}
        >
        <Modal.Header closeButton>
            <Modal.Title>Create a new project</Modal.Title>
        </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Control
                            type="text"
                            value={name}
                            onChange={handleChange}
                            placeholder="Name for your new project"
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button
                    disabled={name === ""}
                    variant="primary"
                    onClick={handleCreate}
                >
                    Create project
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CreateProjectModal;
