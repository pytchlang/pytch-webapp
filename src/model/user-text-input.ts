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
