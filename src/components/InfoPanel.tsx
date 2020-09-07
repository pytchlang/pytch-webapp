import React, { useEffect } from "react";
import { useStoreState, useStoreActions } from "../store";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { IAssetInProject } from "../model/asset";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import { SyncState } from "../model/project";
import { assetServer } from "../skulpt-connection/asset-server";
import Tutorial from "./Tutorial";

interface AssetCardProps {
  asset: IAssetInProject;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  return (
    <Card className="AssetCard">
      <Card.Header>
        <code>{asset.name}</code>
      </Card.Header>
      <Card.Body>
        <Card.Text>Asset ID is {asset.id}; thumbnail to follow.</Card.Text>
      </Card.Body>
    </Card>
  );
};

const Assets = () => {
  const syncState = useStoreState(
    (state) => state.activeProject.assetsSyncState
  );
  const assets = useStoreState((state) => state.activeProject.project?.assets);
  const showModal = useStoreActions((actions) => actions.modals.show);

  const showAddModal = () => {
    showModal("add-asset");
  };

  useEffect(() => {
    if (assets != null) {
      assetServer.prefetch(assets);
    }
  });

  switch (syncState) {
    case SyncState.NoProject:
      return <div>Assets will load shortly....</div>;
    case SyncState.SyncingFromStorage:
      return <div>Assets loading....</div>;
    case SyncState.Error:
      return <div>Assets failed to load, oh no</div>;
    case SyncState.SyncingToStorage:
    case SyncState.Syncd:
      break; // Handle normal cases below.
  }

  // TODO: Some representation that the assets are syncing to storage?

  if (assets == null) {
    throw Error("no project even though LoadingState succeeded");
  }

  const intro =
    assets.length == 0 ? (
      <p>
        Your project does not yet have any images or sounds. Use the button
        below to add some.
      </p>
    ) : (
      <h1>Your project’s images and sounds</h1>
    );

  return (
    <div className="AssetCardPane">
      {intro}
      <div className="AssetCardList">
        {assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
      <div className="buttons">
        <Button onClick={showAddModal}>Add an image or sound</Button>
      </div>
    </div>
  );
};

const StandardOutput = () => {
  const text = useStoreState((state) => state.standardOutputPane.text);

  return <pre className="SkulptStdout">{text}</pre>;
};

const Errors = () => {
  return <div>Any errors your project encounters will appear here.</div>;
};

const InfoPanel = () => {
  const isTrackingTutorial = useStoreState((state) => {
    return state.activeTutorial.syncState !== SyncState.NoProject;
  });
  const activeKey = useStoreState((state) => state.infoPanel.activeTabKey);
  const setActiveKey = useStoreActions(
    (state) => state.infoPanel.setActiveTabKey
  );

  // TODO: Only show Tutorial pane if there's a tutorial present (or on
  // its way).

  return (
    <Tabs
      className="InfoPanel"
      transition={false}
      activeKey={activeKey}
      onSelect={(k) => setActiveKey(k as string)}
    >
      {isTrackingTutorial && (
        <Tab className="InfoPane" eventKey="tutorial" title="Tutorial">
          <Tutorial />
        </Tab>
      )}
      <Tab className="InfoPane" eventKey="assets" title="Images and sounds">
        <Assets />
      </Tab>
      <Tab className="InfoPane" eventKey="output" title="Output">
        <StandardOutput />
      </Tab>
      <Tab className="InfoPane" eventKey="errors" title="Errors">
        <Errors />
      </Tab>
    </Tabs>
  );
};

export default InfoPanel;
