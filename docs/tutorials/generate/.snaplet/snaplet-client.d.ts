type JsonPrimitive = null | number | string | boolean;
type NestedArray<V> = Array<V | NestedArray<V>>;
type Nested<V> = V | { [s: string]: V | Nested<V> } | Array<V | Nested<V>>;
type Json = Nested<JsonPrimitive>;
type ScalarField<T> = T | ((context: { seed: string }) => Promise<T> | T);
type MapScalarField<T extends Record<string, any>> = {
  [K in keyof T]: ScalarField<T[K]>;
};
type ModelInputs<
  TFields extends Record<string, any>,
  TParents extends Record<string, any> = {},
  TChildren extends Record<string, any> = {}
> = {
  data?: Partial<MapScalarField<TFields> & TParents & TChildren>;
  count?: number | ((context: { seed: string }) => number);
  connect?: (context: { seed: string; store: Store }) => TFields | undefined;
};
type OmitDataFields<
  T extends { data?: Record<string, any> },
  TKeys extends keyof NonNullable<T["data"]>
> = Omit<T, "data"> & { data?: Omit<NonNullable<T["data"]>, TKeys> };
export interface IPlan {
  generate: () => Promise<Store>;
}
interface Plan extends IPlan {
  pipe: Pipe;
  merge: Merge;
}
export type Pipe = (plans: IPlan[]) => IPlan;
export type Merge =  (plans: IPlan[]) => IPlan;
type Store = {
  Comment: Comment[];
  Post: Post[];
  User: User[];
};

type Comment = {
  "content": string;
  "id": string;
  "postId": string;
  "userId": string;
  "writtenAt": string | null;
}
type CommentParents = {
 Post: OmitDataFields<PostModel, "Comment">;
 User: OmitDataFields<UserModel, "Comment">;
};
type CommentChildren = {

};
type CommentModel = ModelInputs<Comment, CommentParents, CommentChildren>;
type Post = {
  "content": string;
  "createdBy": string;
  "id": string;
  "title": string;
}
type PostParents = {
 User: OmitDataFields<UserModel, "Post">;
};
type PostChildren = {
 Comment: OmitDataFields<CommentModel, "Post">;
};
type PostModel = ModelInputs<Post, PostParents, PostChildren>;
type User = {
  "email": string;
  "id": string;
  "name": string;
}
type UserParents = {

};
type UserChildren = {
 Comment: OmitDataFields<CommentModel, "User">;
 Post: OmitDataFields<PostModel, "User">;
};
type UserModel = ModelInputs<User, UserParents, UserChildren>;
export type SnapletClient = {
  Comment: (inputs: CommentModel) => Plan;
  Post: (inputs: PostModel) => Plan;
  User: (inputs: UserModel) => Plan;
};