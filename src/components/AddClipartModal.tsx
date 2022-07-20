import React, { useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { Button } from "react-bootstrap";
import { useStoreState, useStoreActions } from "../store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClipArtGalleryState } from "../model/clipart-gallery";
import { assertNever } from "../utils";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";

const bodyContent = (
  gallery: ClipArtGalleryState,
  selectedIds: Array<number>,
  selectItemById: (id: number) => void,
  deselectItemById: (id: number) => void
) => {
  switch (gallery.status) {
    case "fetch-failed":
      return <p>Oops, sorry</p>;
    case "fetch-not-started":
    case "fetch-pending":
      return <p>loading...</p>;
    case "ready":
      return (
        <div className="clipart-gallery">
          <ul>
            {gallery.items.map((item: any) => {
              const isSelected =
                selectedIds.findIndex((id) => id === item.id) !== -1;
              const extraClass = isSelected ? " selected" : "";
              const clickHandler = isSelected
                ? deselectItemById
                : selectItemById;
              return (
                <li>
                  <div
                    className="clipart-card"
                    onClick={() => clickHandler(item.id)}
                  >
                    <p className="clipart-checkmark">
                      <span className={`clipart-selection${extraClass}`}>
                        <FontAwesomeIcon
                          className="fa-lg"
                          icon="check-circle"
                        />
                      </span>
                    </p>
                    <p className="clipart-name">{item.name}</p>
                    <p className="clipart-thumbnail">
                      <img style={{ width: 100 }} src={item.url} />
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      );
  }
};

