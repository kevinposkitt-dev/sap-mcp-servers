#!/usr/bin/env python3
"""Build a deterministic FTS5 index from a BAH refresh snapshot."""
from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path


def text(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    return str(value)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("snapshot", type=Path, nargs="?", default=Path("knowledge/bah/current"))
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    snapshot = args.snapshot.resolve()
    output = (args.output or snapshot / "bah-knowledge.db").resolve()
    chunks = json.loads((snapshot / "chunks.json").read_text())
    manifest = json.loads((snapshot / "manifest.json").read_text())

    output.unlink(missing_ok=True)
    db = sqlite3.connect(output)
    db.executescript(
        """
        PRAGMA journal_mode=WAL;
        CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE chunks (
          id TEXT PRIMARY KEY,
          kind TEXT NOT NULL,
          application_id TEXT,
          application_title TEXT,
          package_id TEXT,
          package_title TEXT,
          artifact_id TEXT,
          artifact_title TEXT,
          source_url TEXT,
          source_hash TEXT,
          body TEXT NOT NULL
        );
        CREATE VIRTUAL TABLE chunks_fts USING fts5(
          id UNINDEXED, kind, application_title, package_title,
          artifact_title, body, content='chunks', content_rowid='rowid'
        );
        CREATE TRIGGER chunks_ai AFTER INSERT ON chunks BEGIN
          INSERT INTO chunks_fts(rowid,id,kind,application_title,package_title,artifact_title,body)
          VALUES(new.rowid,new.id,new.kind,new.application_title,new.package_title,new.artifact_title,new.body);
        END;
        """
    )
    db.executemany("INSERT INTO metadata(key,value) VALUES(?,?)", [
        ("generatedAt", manifest["generatedAt"]),
        ("source", manifest["source"]),
        ("manifestHash", text(manifest.get("summary"))),
    ])
    rows = []
    for chunk in chunks:
        body = text(chunk)
        chunk_id = f'{chunk.get("applicationId", "unknown")}:{chunk.get("packageId", "none")}:{chunk.get("id")}'
        rows.append((
            chunk_id, chunk.get("kind", "unknown"), chunk.get("applicationId"),
            chunk.get("applicationTitle"), chunk.get("packageId"), chunk.get("packageTitle"),
            chunk.get("artifactId") or chunk.get("id"), chunk.get("artifactTitle") or chunk.get("displayName"),
            chunk.get("sourceUrl") or chunk.get("url"), chunk.get("sourceHash"), body,
        ))
    db.executemany("INSERT INTO chunks VALUES(?,?,?,?,?,?,?,?,?,?,?)", rows)
    db.commit()
    count = db.execute("SELECT count(*) FROM chunks").fetchone()[0]
    db.close()
    print(json.dumps({"output": str(output), "chunks": count}))


if __name__ == "__main__":
    main()
