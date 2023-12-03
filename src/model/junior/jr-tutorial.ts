// Use full word "Identifier" so as not to make people think it's a
// short numeric id, or a Uuid, or anything like that.
type ActorIdentifier = { kind: "stage" } | { kind: "sprite"; name: string };
