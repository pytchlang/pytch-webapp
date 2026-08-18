import React from "react";
import { useTranslation } from "react-i18next";
import Modal from "react-bootstrap/Modal";
import { GenericWorkingSpinner } from "../Junior/GenericWorkingSpinner";

export const GenericWorkingModal = () => {
  const { t } = useTranslation("common");
  return (
    <Modal
      className="GenericWorkingModal"
      show={true}
      animation={false}
      centered
    >
      <Modal.Header>
        <Modal.Title>{t("working.title")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <GenericWorkingSpinner />
      </Modal.Body>
    </Modal>
  );
};
