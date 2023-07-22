/// <reference types="cypress" />

import { AsyncFile } from "../../src/storage/google-drive";
import { MockApiBehaviour } from "../../src/storage/google-drive/mock";
type MatchContent = Parameters<Cypress.Chainable["contains"]>[1];

context("Google Drive import and export", () => {
  const setApiBehaviourOpts = (behaviour: MockApiBehaviour) => ({
    extraWindowActions: [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (window: any) => {
        window.$GoogleDriveApiBehaviour = behaviour;
      },
    ],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const specShouldAllBeUsed = (window: any) => {
    const spec = window.$GoogleDriveApiBehaviour;
    const allUsed =
      spec.boot.length === 0 &&
      spec.exportFile.length === 0 &&
      spec.importFiles.length === 0 &&
      spec.acquireToken.length === 0;

    expect(allUsed, "all mock-API behaviour specifiers consumed").eq(true);
  };

  afterEach(() => {
    cy.window().then(specShouldAllBeUsed);
  });

  it("disables actions while booting", () => {
    const mockBehaviour: MockApiBehaviour = {
      boot: ["stall"],
      acquireToken: [],
      getUserInfo: [],
      exportFile: [],
      importFiles: [],
    };

    cy.pytchExactlyOneProject(setApiBehaviourOpts(mockBehaviour));
    cy.contains("⋮").click();
    cy.get(".dropdown-item")
      .contains("Export to Google")
      .should("have.class", "disabled");

    cy.pytchHomeFromIDE();
    cy.contains("My projects").click();
    cy.get("button").contains("Import from Google").should("be.disabled");
  });

  it("shows messages if boot fails", () => {
    const mockBehaviour: MockApiBehaviour = {
      boot: ["fail"],
      acquireToken: [],
      getUserInfo: [],
      exportFile: [],
      importFiles: [],
    };

    cy.pytchExactlyOneProject(setApiBehaviourOpts(mockBehaviour));
    cy.contains("⋮").click();
    cy.get(".dropdown-item")
      .contains("Drive unavailable")
      .should("have.class", "disabled");

    cy.pytchHomeFromIDE();
    cy.contains("My projects").click();
    cy.get("button").contains("Drive unavailable").should("be.disabled");
  });

  context("with successful boot", () => {
    const assertExportFailureShown = (expMessage: string) => {
      cy.get(".modal-header").contains("Export to Google");
      cy.get(".modal-body")
        .find(".outcome-summary.failures")
        .contains(expMessage);
      cy.get("button").contains("OK").click();
    };

    const assertExportFails = (expMessage: string) => {
      cy.pytchChooseDropdownEntry("Export");
      assertExportFailureShown(expMessage);
    };

    const assertExportSucceeds = () => {
      cy.pytchChooseDropdownEntry("Export");
      cy.get(".modal-header").contains("Export to Google");
      cy.get(".modal-body").contains("Name of file");
      cy.get("button").contains("Export").click();
      cy.get(".modal-body").contains(/Project exported to.*[.]zip/);
      cy.get("button").contains("OK").click();
    };

    it("shows error if no auth then succeeds on retry", () => {
      // The user chooses Cancel in the Google log-in pop-up, thereby
      // denying permission.
      const mockBehaviour: MockApiBehaviour = {
        boot: ["ok"],
        acquireToken: ["fail", "ok"],
        getUserInfo: ["ok"],
        exportFile: ["ok"],
        importFiles: [],
      };

      cy.pytchExactlyOneProject(setApiBehaviourOpts(mockBehaviour));
      assertExportFails("Could not log in");
      assertExportSucceeds();
    });

    it("shows error if no user info then succeeds on retry", () => {
      const mockBehaviour: MockApiBehaviour = {
        boot: ["ok"],
        acquireToken: ["ok", "ok"],
        getUserInfo: ["fail", "ok"],
        exportFile: ["ok"],
        importFiles: [],
      };

      cy.pytchExactlyOneProject(setApiBehaviourOpts(mockBehaviour));
      assertExportFails("Could not get user information");
      assertExportSucceeds();
    });

    it("allows auth cancel if popup closed", () => {
      // The Google auth pop-up appears but is then closed by the user,
      // leaving the user looking at the "authenticating..." modal with
      // its cancel button.  The user has to click "Cancel".
      const mockBehaviour: MockApiBehaviour = {
        boot: ["ok"],
        acquireToken: ["wait"],
        getUserInfo: [],
        exportFile: [],
        importFiles: [],
      };

      cy.pytchExactlyOneProject(setApiBehaviourOpts(mockBehaviour));
      cy.pytchChooseDropdownEntry("Export");
      cy.get(".modal-header").contains("Connecting to Google");
      cy.get("button").contains("Cancel").click();
      assertExportFailureShown("User cancelled");
    });

    const assertOutcomeContent = (
      targetClass: string,
      matchers: Array<MatchContent>
    ) => {
      const selector = `.outcome-summary.${targetClass}`;
      if (matchers.length === 0) {
        cy.get(selector).should("not.exist");
      } else {
        cy.get(selector)
          .find("li")
          .as("outcome-li")
          .should("have.length", matchers.length);
        matchers.forEach((m, i) => cy.get("@outcome-li").eq(i).contains(m));
      }
    };

    const assertTaskDoneInfo = (
      expHeader: string,
      expAuthInfoValidity: "valid" | "failed",
      expMessage: string | null,
      expSuccesses: Array<MatchContent>,
      expFailures: Array<MatchContent>
    ) => {
      cy.get(".modal-header").contains(expHeader);

      const [expUserName, expUserEmail] =
        expAuthInfoValidity === "valid"
          ? ["J. Random User", "j.random.user@example.com"]
          : ["unknown user", "unknown email address"];

      cy.get(".user-info").contains(expUserName);
      cy.get(".user-info").contains(expUserEmail);

      if (expMessage != null) {
        cy.get(".modal-body > p").contains(expMessage);
      }

      assertOutcomeContent("successes", expSuccesses);
      assertOutcomeContent("failures", expFailures);

      cy.get("button").contains("OK").click();
    };

    function successfulExportMockBehaviour(nExports: number): MockApiBehaviour {
      return {
        boot: ["ok"],
        acquireToken: ["ok"],
        getUserInfo: ["ok"],
        exportFile: new Array(nExports).fill("ok"),
        importFiles: [],
      };
    }

    it("can export (accepting suggested filename)", () => {
      cy.pytchExactlyOneProject(
        setApiBehaviourOpts(successfulExportMockBehaviour(1))
      );
      cy.pytchChooseDropdownEntry("Export");
      cy.get("button").contains("Export").click();

      assertTaskDoneInfo(
        "Export to Google",
        "valid",
        null,
        [/Project exported to.*[.]zip/],
        []
      );
    });

    const specs = [
      { label: "explicit zip suffix", suffix: ".zip" },
      { label: "no suffix", suffix: "" },
    ];

    specs.forEach((spec) => {
      it(`can export (choosing own filename; ${spec.label})`, () => {
        cy.pytchExactlyOneProject(
          setApiBehaviourOpts(successfulExportMockBehaviour(1))
        );

        cy.pytchChooseDropdownEntry("Export");
        cy.get(".modal-body").find("input").as("filename");
        cy.get("@filename").type("{selectAll}{del}");
        cy.get("button").contains("Export").should("be.disabled");
        cy.get("@filename").type(".zip");
        cy.get("button").contains("Export").should("be.disabled");
        cy.get("@filename").type(`{selectAll}Cool project${spec.suffix}`);
        cy.get("button").contains("Export").click();

        assertTaskDoneInfo(
          "Export to Google",
          "valid",
          null,
          [/Project exported to "Cool project.zip"/],
          []
        );
        cy.get(".modal-body").should("not.exist");
      });
    });

    it("can cancel export", () => {
      cy.pytchExactlyOneProject(
        setApiBehaviourOpts(successfulExportMockBehaviour(0))
      );
      cy.pytchChooseDropdownEntry("Export");
      cy.get("button").contains("Cancel").click();

      assertTaskDoneInfo(
        "Export to Google",
        "valid",
        null,
        [],
        [/User cancelled export/]
      );
    });

    it("shows error if export fails", () => {
      const mockBehaviour: MockApiBehaviour = {
        boot: ["ok"],
        acquireToken: ["ok"],
        getUserInfo: ["ok"],
        exportFile: ["fail"],
        importFiles: [],
      };

      cy.pytchExactlyOneProject(setApiBehaviourOpts(mockBehaviour));
      cy.pytchChooseDropdownEntry("Export");
      cy.get("button").contains("Export").click();

      assertTaskDoneInfo(
        "Export to Google",
        "failed",
        null,
        [],
        [/Something went wrong/]
      );
    });

    it("shows error if import fails", () => {
      const mockBehaviour: MockApiBehaviour = {
        boot: ["ok"],
        acquireToken: ["ok"],
        getUserInfo: ["ok"],
        exportFile: [],
        importFiles: [{ kind: "fail", message: "Moon phase wrong" }],
      };

      cy.pytchResetDatabase(setApiBehaviourOpts(mockBehaviour));
      cy.contains("My projects").click();
      cy.contains("Import from Google").click();

      assertTaskDoneInfo(
        "Import from Google",
        "failed",
        null,
        [],
        [/Moon phase wrong/]
      );
    });

    // In the zipfile tests below, if I use ArrayBufferFromString() and
    // use the resulting ArrayBuffer as the value with which to resolve
    // the AsyncFile.data() promise, the resulting ArrayBuffer seems to
    // stop being an ArrayBuffer by the time it's extracted by the mock
    // API machinery.  Investigated a bit and did not get to the bottom;
    // gave up.  Instead, pass the string (which JSZip is happy with),
    // and fib about it to TypeScript.
    const newAsyncFile = (name: string, data: string): AsyncFile => ({
      name: () => Promise.resolve(name),
      mimeType: () => Promise.resolve("application/zip"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: () => Promise.resolve(data as any),
    });

    it("handles import of valid zip", () => {
      cy.fixture("project-zipfiles/hello-again-world.zip", "binary").then(
        (strData: string) => {
          const goodFile = newAsyncFile("hello-world-123.zip", strData);
          const mockBehaviour: MockApiBehaviour = {
            boot: ["ok"],
            acquireToken: ["ok"],
            getUserInfo: ["ok"],
            exportFile: [],
            importFiles: [{ kind: "ok", files: [goodFile] }],
          };

          cy.pytchResetDatabase(setApiBehaviourOpts(mockBehaviour));
          cy.contains("My projects").click();
          cy.contains("Import from Google").click();

          assertTaskDoneInfo(
            "Import from Google",
            "valid",
            null,
            [/Imported.*hello-world-123/],
            []
          );

          // Check have been sent to IDE:
          cy.contains("images and sounds");
        }
      );
    });

    it("handles user-cancelled import", () => {
      const mockBehaviour: MockApiBehaviour = {
        boot: ["ok"],
        acquireToken: ["ok"],
        getUserInfo: ["ok"],
        exportFile: [],
        importFiles: [{ kind: "ok", files: [] }],
      };

      cy.pytchResetDatabase(setApiBehaviourOpts(mockBehaviour));
      cy.contains("My projects").click();
      cy.contains("Import from Google").click();

      assertTaskDoneInfo(
        "Import from Google",
        "valid",
        "No files selected",
        [],
        []
      );

      // Should be left on "My projects" page:
      cy.contains("Import from Google Drive");
    });

    it("handles import of mixed in/valid zips", () => {
      cy.fixture("project-zipfiles/hello-again-world.zip", "binary").then(
        (strData: string) => {
          const goodFile = newAsyncFile("hello-world-123.zip", strData);
          cy.fixture("project-zipfiles/no-meta-json.zip", "binary").then(
            (strData: string) => {
              const badFile = newAsyncFile("bad-file.zip", strData);
              const mockBehaviour: MockApiBehaviour = {
                boot: ["ok"],
                acquireToken: ["ok"],
                getUserInfo: ["ok"],
                exportFile: [],
                importFiles: [{ kind: "ok", files: [goodFile, badFile] }],
              };

              cy.pytchResetDatabase(setApiBehaviourOpts(mockBehaviour));
              cy.contains("My projects").click();
              cy.contains("Import from Google").click();

              assertTaskDoneInfo(
                "Import from Google",
                "valid",
                null,
                [/Imported.*hello-world-123/],
                [/There was a problem.*could not find "meta.json"/]
              );

              // Should be left on "My projects" page, with successful
              // project listed:
              cy.contains("Import from Google Drive");
              cy.contains(/Created from zipfile.*hello-world-123/);
            }
          );
        }
      );
    });
  });
});
