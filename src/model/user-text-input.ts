import { Action, action, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";

////////////////////////////////////////////////////////////////////////////////
//
// After each project frame, there might be a question which the user's
// code has posed, via ask_and_wait_for_answer().  This user-text-input
// model slice represents the the webapp's view of the state of this
// interaction.  From the webapp's point of view, there can sometimes be
// an active "user text input" element.  This goes through the following
// states:
//
// "idle" --- no question is being asked by the VM
//
//     After a call to setQuestion(), move to:
//
// "interactable" --- there is a live question being asked by the VM,
// and the user is being given a chance to answer it; the user can
// interact with the text input element of the UI; in this state,
// repeated calls to setAnswer() are permissible
//
//     After a call to submit(), move to:
//
// "submitted" --- the user has pressed the Enter key or clicked on the
// check-box icon, to submit their response *to the webapp*; there is a
// further step required before that answer gets *to the VM*; see below
//
//     After a call to maybeAcquireSubmission(), move back to "idle".
//
// It is also permissible to call reset() while in "interactable", to
// move back to "idle".
//
// The main ProjectEngine.oneFrame() method takes care of moving data in
// both directions: passing a question from the VM to the webapp, and
// passing an answer from the webapp to the VM.
//
// The project within the VM reports whether a question should be live
// in the return value of its one_frame() method.  If there is a live
// question, the ProjectEngine passes it to the user-text-input model
// slice via setQuestion().
//
// In the other direction, the ProjectEngine takes care of 'acquiring'
// any submitted-to-webapp answer and passing it on to the VM.  The act
// of acquiring the answer from the user-text-input puts its state back
// to "idle".
//
// The user's answer is get/set by the QuestionInputPanel component,
// which renders the text input element, along with the live question's
// prompt, if any.

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

export const userTextInput: IUserTextInput = {
  questionId: 0,
  prompt: null,
  answer: "",
  state: "idle",
};
