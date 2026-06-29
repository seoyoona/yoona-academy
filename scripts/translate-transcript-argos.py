import json
import sys

from argostranslate import translate


def main() -> None:
    texts = json.load(sys.stdin)
    translated = [translate.translate(text, "en", "ko") for text in texts]
    json.dump(translated, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
