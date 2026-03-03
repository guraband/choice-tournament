import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useTournament } from "../state/TournamentContext";
import { decodeShareDraft } from "../utils/share";
import { resizeImageToBase64 } from "../utils/image";

type RoundOption = 16 | 32;

type DraftItem = {
  id: string;
  name: string;
  imageBase64?: string;
};

const INITIAL_ITEMS_PLACEHOLDER = `후보를 한 줄에 하나씩 입력하세요.\n예)\n민트초코\n바닐라\n초코\n딸기`;

function createId(index: number, name: string) {
  return `${index}-${name}`;
}

export function CreatePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { createFromDraft } = useTournament();
  const [topic, setTopic] = useState("");
  const [rawItems, setRawItems] = useState("");
  const [roundOption, setRoundOption] = useState<RoundOption>(16);
  const [shuffleEnabled, setShuffleEnabled] = useState(true);
  const [seedFixed, setSeedFixed] = useState(true);
  const [seedInput, setSeedInput] = useState(() => String(Math.floor(Math.random() * 1_000_000)));
  const [itemImages, setItemImages] = useState<Record<string, string>>({});
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    const shareRaw = new URLSearchParams(location.search).get("share");
    if (!shareRaw) {
      return;
    }

    const sharedDraft = decodeShareDraft(shareRaw);
    if (!sharedDraft) {
      return;
    }

    setTopic(sharedDraft.topic);
    setRawItems(sharedDraft.items.join("\n"));
    setSeedInput(String(sharedDraft.seed));
    setShuffleEnabled(true);
    setRoundOption(sharedDraft.items.length === 32 ? 32 : 16);
  }, [location.search]);

  const parsedItems = useMemo<DraftItem[]>(() => {
    return rawItems
      .split("\n")
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .map((name, index) => {
        const id = createId(index, name);
        return {
          id,
          name,
          imageBase64: itemImages[id],
        };
      });
  }, [itemImages, rawItems]);

  const duplicateNames = useMemo(() => {
    const counter = new Map<string, number>();

    parsedItems.forEach((item) => {
      counter.set(item.name, (counter.get(item.name) ?? 0) + 1);
    });

    return Array.from(counter.entries())
      .filter(([, count]) => count > 1)
      .map(([name]) => name);
  }, [parsedItems]);

  const topicError = topic.trim().length === 0 ? "주제를 입력해 주세요." : null;

  const countError =
    parsedItems.length === 0
      ? "후보를 입력해 주세요."
      : parsedItems.length !== roundOption
        ? `선택한 라운드(${roundOption}강)에 맞춰 후보를 정확히 ${roundOption}개 입력해 주세요.`
        : null;

  const hasValidationError = Boolean(topicError || countError);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const imageBase64 = await resizeImageToBase64(file, 256);
      setItemImages((prev) => ({
        ...prev,
        [itemId]: imageBase64,
      }));
      setImageError(null);
    } catch {
      setImageError("이미지 처리에 실패했습니다. 다른 파일로 다시 시도해 주세요.");
    } finally {
      event.target.value = "";
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (hasValidationError) {
      return;
    }

    createFromDraft({
      topic: topic.trim(),
      round: roundOption,
      shuffleEnabled,
      seed: Number(seedInput) || 0,
      items: parsedItems,
    });

    navigate("/match");
  };

  return (
    <main style={{ margin: "0 auto", maxWidth: 840, padding: "2rem 1rem" }}>
      <h1>새 토너먼트 만들기</h1>
      <p>주제와 후보를 입력하고 16강/32강 옵션을 선택해 시작해 보세요.</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        <label style={{ display: "grid", gap: "0.5rem" }}>
          <span>주제</span>
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="예: 오늘 점심 메뉴"
          />
        </label>
        {topicError ? <p style={{ color: "crimson", margin: 0 }}>{topicError}</p> : null}

        <label style={{ display: "grid", gap: "0.5rem" }}>
          <span>후보 목록 (1줄 1후보)</span>
          <textarea
            value={rawItems}
            onChange={(event) => setRawItems(event.target.value)}
            rows={12}
            placeholder={INITIAL_ITEMS_PLACEHOLDER}
          />
        </label>
        <p style={{ margin: 0 }}>정제된 후보 수: {parsedItems.length}개</p>
        {countError ? <p style={{ color: "crimson", margin: 0 }}>{countError}</p> : null}
        {duplicateNames.length > 0 ? (
          <p style={{ color: "darkorange", margin: 0 }}>
            중복 후보가 있습니다: {duplicateNames.join(", ")} (진행은 가능하지만 구분이 어려울 수 있습니다)
          </p>
        ) : null}

        <fieldset style={{ display: "grid", gap: "0.5rem" }}>
          <legend>라운드 옵션</legend>
          <label>
            <input
              type="radio"
              name="round"
              value="16"
              checked={roundOption === 16}
              onChange={() => setRoundOption(16)}
            />
            16강
          </label>
          <label>
            <input
              type="radio"
              name="round"
              value="32"
              checked={roundOption === 32}
              onChange={() => setRoundOption(32)}
            />
            32강
          </label>
        </fieldset>

        <fieldset style={{ display: "grid", gap: "0.5rem" }}>
          <legend>셔플 / 시드 설정</legend>
          <label>
            <input
              type="checkbox"
              checked={shuffleEnabled}
              onChange={(event) => setShuffleEnabled(event.target.checked)}
            />
            셔플 사용
          </label>
          <label>
            <input
              type="checkbox"
              checked={seedFixed}
              onChange={(event) => setSeedFixed(event.target.checked)}
            />
            시드 고정
          </label>
          <label style={{ display: "grid", gap: "0.25rem", maxWidth: 240 }}>
            <span>시드 값</span>
            <input
              type="number"
              value={seedInput}
              onChange={(event) => setSeedInput(event.target.value)}
              disabled={!seedFixed}
            />
          </label>
        </fieldset>

        <section style={{ display: "grid", gap: "0.5rem" }}>
          <h2 style={{ marginBottom: 0 }}>후보별 이미지 첨부 (선택)</h2>
          <p style={{ margin: 0 }}>업로드 시 최대 256x256으로 리사이즈되어 base64로 저장됩니다.</p>
          {imageError ? <p style={{ color: "crimson", margin: 0 }}>{imageError}</p> : null}

          {parsedItems.length === 0 ? (
            <p style={{ margin: 0 }}>후보를 입력하면 이미지 첨부 영역이 표시됩니다.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.5rem" }}>
              {parsedItems.map((item) => (
                <li key={item.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: "0.75rem" }}>
                  <strong>{item.name}</strong>
                  <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => void handleImageChange(event, item.id)}
                    />
                    {item.imageBase64 ? <span>첨부 완료</span> : <span>미첨부</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button type="submit" disabled={hasValidationError} style={{ maxWidth: 180 }}>
          시작하기
        </button>
      </form>
    </main>
  );
}
