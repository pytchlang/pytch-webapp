import React from "react";
import Card from "react-bootstrap/Card";
import { useTranslation } from "react-i18next";
import { ScopedResourceKind } from "../../model/resource";

type NoContentHelpProps = {
  scopedResourceKind: ScopedResourceKind;
};
export const NoContentHelp: React.FC<NoContentHelpProps> = ({
  scopedResourceKind,
}) => {
  const { t } = useTranslation("ide");
  const content = t(`no-content-help.${scopedResourceKind}`);

  return (
    <div className={"h-100 d-flex align-items-center justify-content-center"}>
      <Card className="NoContentHelp" body>
          <p>{content}</p>
      </Card>
    </div>
  );
};
