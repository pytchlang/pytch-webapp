import React, { useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { Button } from "react-bootstrap";
import { useStoreState, useStoreActions } from "../store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClipArtGalleryState } from "../model/clipart-gallery";
import { assertNever } from "../utils";
import { MaybeErrorOrSuccessReport } from "./MaybeErrorOrSuccessReport";
