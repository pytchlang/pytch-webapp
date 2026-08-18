import React from "react";
import Modal from "react-bootstrap/Modal";
import { EnglishOnlyLoadingSpinner } from "./Junior/AriaWrappedSpinner";
import pytchLogo from "../images/pytch-tight-crop.png";

export const AppLoadingPlaceholder = () => {
  // When AppLoadingPlaceholder is rendered, the i18n machinery is not
  // ready, so we have to fall back to this English-only component.

  return (
    <Modal
      className="AppLoadingPlaceholder"
      show={true}
      animation={false}
      centered
    >
      <Modal.Body>
        <div className="spinner-container">
          <div>
            <img
              className="mb-5"
              src={pytchLogo}
              alt="Pytch Logo"
              height="80"
            />
          </div>
          <EnglishOnlyLoadingSpinner />
        </div>
      </Modal.Body>
    </Modal>
  );
};
