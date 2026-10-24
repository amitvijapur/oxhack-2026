# Typed extraction with Jev, and where images fit

25 October 2026. Owner: Salman. Design only. No API calls have been made with the team's key. Sources: [TypeSafe docs](https://docs.typesafe.ai), [Jev 1.14 release notes](https://typesafe.ai/blog/jev-1-14), the [TypeSafe skill](https://github.com/typesafe-ai/skills), and the [OpenAI Decisions guide](https://developers.openai.com/api/docs/guides/decisions).

## The rule: judgments from Jev, decisions in code

Jev answers typed questions (Choice, Score, Noul, and Box for images) with probabilities. In this project it **reads text and images and returns labelled facts**. The decision engine stays in code. Jev is never asked "should we buy?". It is asked observable things, such as "does this answer say gold goes up?" or "is there a road touching the parcel on this map?". The truth table that turns those answers into BUY/HOLD/SELL/SKIP lives in the engine, where it can be tested.

## Two interchangeable backends, one adapter

| | TypeSafe Jev | OpenAI Decisions |
|---|---|---|
| Endpoint | `POST https://api.typesafe.ai/v1/systemone` | `POST /v1/decisions` |
| Model | `jev-1.14.0` (`jev-latest`) | `gpt-6-luna` |
| Question types | Choice, Score, Noul, Box | choice, score, predicate |
| Images | Yes, with header `TypeSafe-Danger-Zone-Images: true` (not production-ready) | Yes |
| Input price | $0.042 per 1M tokens; output free | $0.10 per 1M tokens; output free |
| Free numbers | No: select a candidate, then parse in code | No |

The combined strategy names OpenAI Decisions as Amit's preferred candidate; Salman now has a Jev key. Both have almost the same shape, so the adapter supports both behind one interface, plus a rules fallback that keeps the demo working offline:

```python
class Extractor(Protocol):
    def extract(self, state: dict, questions: dict[str, QuestionSpec]) -> dict[str, Answer]: ...

@dataclass
class QuestionSpec:
    kind: Literal["choice", "score", "noul", "number"]
    instructions: str
    options: dict[str, str] | list[str] | None = None   # choice options or score levels
    candidates_regex: str | None = None                  # for "number": code finds spans, the model picks one

@dataclass
class Answer:
    value: str | float | bool | None
    probabilities: dict[str, float]
    backend: Literal["jev", "openai_decisions", "rules"]
```

Backends are tried in a fixed order: Jev, then OpenAI Decisions, then rules. A failed call is an error, never a "no". Every answer records its backend, and answers are cached by a hash of state and questions, so the engine replays identically. TypeSafe's [`system-one-adapter-python`](https://github.com/typesafe-ai/system-one-adapter-python) can serve the same question format through other LLMs if needed.

## Questions for the swarm handoff

Jev is only needed when the swarm's interview answers arrive as free text. Each question asks for one judgment, and code combines them:

| Field | Question | Type |
|---|---|---|
| `price.direction` | "Does `answer` expect the gold price to be higher, about the same, or lower by day 5?" Options `higher`, `about_the_same`, `lower` | Choice |
| `price.size_fraction` | Code finds the percentages and dollar figures in the text; the model picks the one that is the expected move, or answers a companion Noul "Does `answer` give a size for the move?" | Number via selection + Noul |
| `policy.move` | One Noul per move: "Does `answer` say the state will approve the mine?", "… raise the mining tax?", "… block or delay the mine?" | Noul per statement (several can be true) |
| `policy.timing_days` | Candidate spans ("next week", "within a month") found in code; the model picks one; code converts it to days | Number via selection |
| `leaning.direction` | "Does `answer` say locals lean towards or against mining?" Options `towards`, `against`, `split` | Choice |
| Grounding | "Does `answer` cite a specific post or seed fact?" | Noul |

Noul thresholds start at 0.7 for yes and 0.3 for no. The band in between is "unsettled" and has its own row in the truth table. The thresholds are tested on held-out answers, never fitted to a few examples. The probabilities are recalibrated on our own labelled answers before they are trusted.

## Images: what the new models can do

- **How to enable:** send the header `TypeSafe-Danger-Zone-Images: true` with every request that contains an image or a Box question. Without it the API returns `400`. TypeSafe labels the feature "Dreamer-ready": not production-ready, and limits and accuracy may change between releases.
- **Where images go:** anywhere text can go, in `state`, in a question's `instructions`, or in its `criteria`, through a top-level `assets` map referenced by unique strings. Images in `state` are sent once and shared by all questions.
- **Upload:** multipart is recommended. Base64 also works. The Python SDK's `Image(Path(...))` handles both.
- **Limits:**
  - PNG or JPEG only.
  - Each side 280–1568 px.
  - 16 MiB per image, 32 MiB per request.
  - Oversized images are rejected, not resized.
  - EXIF orientation is ignored, so rotate images first.
- **Cost:** billed as ordinary input tokens.
- **Box** (new in 1.14) returns `box {top, bottom, left, right}` as fractions of the image, with a `confidence`.
  - It always returns a box, so pair it with a Noul asking "is it there?".
  - It finds one target per question.
  - For small targets, pick a tile with a Choice, then run Box on that tile.
- **Accuracy:** TypeSafe notes that all models, Jev included, do worse on images than on text.

## Where images help this project

Images fill **gates and evidence**, never the money decision:

1. **Access and liability gates.** From a claim plat, a map or listing photos, ask one Noul per check: "Does a road touch the outlined parcel in `map`?", "Is there a mine opening or waste pile in `photo`?", "Is open water visible?". Answers fill gate fields as `pass`, `fail` or `unknown` with method `jev_image`. Anything between the thresholds goes to `manual_review`.
2. **Map overlay check.** Render a Tok sample point over the DNR claim polygons. Box plus a presence Noul cross-checks Arjin's geometric join as a visual QA step. It doesn't replace the join.
3. **Finding terms in scanned filings.** A Choice over page tiles finds the payment-schedule table or claim map in a scanned press release or 10-K. Box crops it, and code parses the crop. This speeds up the catalogue's split into dated cash-flow components.

## Key handling

- Put `TYPESAFE_API_KEY` in a local `.env`. Git ignores `.env*` except `.env.example`, which holds an empty placeholder.
- Keys stay on the machine that calls the API.
- Before any live test request, agree a small budget and check that no private data is in the state. The TypeSafe skill asks for that permission step too.
