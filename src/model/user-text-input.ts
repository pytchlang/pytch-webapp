import { Action, action, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";

////////////////////////////////////////////////////////////////////////////////

// Description, coming from the VM, of a question which should be live.
export interface IQuestionFromVM {
  id: number;
  prompt: string | null;
}

// Description, ready to be given to the VM, of the answer submitted by
// the user.
export interface IUserAnswerSubmissionToVM {
  questionId: number;
  answer: string;
}

// There isn't always a submitted answer.
export type MaybeUserAnswerSubmissionToVM = IUserAnswerSubmissionToVM | null;

type UserTextInputState = "idle" | "interactable" | "submitted";

export interface IUserTextInput {
  reset: Action<IUserTextInput>;

  questionId: number;
  prompt: string | null;

  // Ensure we are asking the given question as received from the VM. It
  // is permissible, and is a no-op, to make consecutive calls to
  // setQuestion() with no intervening successful call to
  // maybeAcquireSubmission() as long as all such calls to setQuestion()
  // have the same question-id.
  setQuestion: Action<IUserTextInput, IQuestionFromVM>;

  answer: string;
  setAnswer: Action<IUserTextInput, string>;
  submit: Action<IUserTextInput>;

  maybeAcquireSubmission: Thunk<
    IUserTextInput,
    void,
    any,
    IPytchAppModel,
    MaybeUserAnswerSubmissionToVM
  >;

  state: UserTextInputState;
}
