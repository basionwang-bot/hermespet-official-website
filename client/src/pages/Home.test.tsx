import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./Home";

// Mock wouter
vi.mock("wouter", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useLocation: () => ["/", vi.fn()],
}));

describe("Home Page", () => {
  it("renders the brand name", () => {
    render(<Home />);
    expect(screen.getAllByText("HermesPet").length).toBeGreaterThan(0);
  });

  it("renders the hero lede", () => {
    render(<Home />);
    expect(screen.getByText(/点一下就聊，按住就说/)).toBeTruthy();
  });

  it("renders navigation links", () => {
    render(<Home />);
    expect(screen.getAllByText("下载").length).toBeGreaterThan(0);
    expect(screen.getByText("体验")).toBeTruthy();
    expect(screen.getByText("引擎")).toBeTruthy();
    expect(screen.getByText("历程")).toBeTruthy();
    expect(screen.getByText("官方")).toBeTruthy();
  });

  it("renders the official badge", () => {
    render(<Home />);
    expect(screen.getByText("官方网站")).toBeTruthy();
  });

  it("announces the released Windows preview build", () => {
    render(<Home />);
    expect(screen.getByText("Windows 尝鲜版已发布")).toBeTruthy();
  });

  it("renders both platform download cards", () => {
    render(<Home />);
    expect(screen.getByText("macOS")).toBeTruthy();
    expect(screen.getByText("Windows")).toBeTruthy();
    expect(screen.getAllByText(/Apple Silicon/).length).toBeGreaterThan(0);
    expect(screen.getByText(/下载 Setup/)).toBeTruthy();
  });

  it("renders the narrative feature rows", () => {
    render(<Home />);
    expect(screen.getAllByText(/点刘海/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/知识云图/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/跨对话记忆/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AI 笔记/).length).toBeGreaterThan(0);
  });

  it("renders the more-capabilities cards", () => {
    render(<Home />);
    expect(screen.getByText("按住说话")).toBeTruthy();
    expect(screen.getByText("拖进文件")).toBeTruthy();
    expect(screen.getByText("并行处理")).toBeTruthy();
  });

  it("renders engine switcher tabs", () => {
    render(<Home />);
    expect(screen.getAllByText("在线 AI").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hermes Gateway").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Claude Code").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Codex").length).toBeGreaterThan(0);
  });

  it("renders the FAQ section", () => {
    render(<Home />);
    expect(screen.getByText("常见问题")).toBeTruthy();
    expect(screen.getByText(/HermesPet 是免费的吗/)).toBeTruthy();
  });

  it("renders official certification section", () => {
    render(<Home />);
    expect(screen.getAllByText("Basion Wang").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Apache License 2.0").length).toBeGreaterThan(0);
  });

  it("renders copyright footer", () => {
    render(<Home />);
    expect(screen.getAllByText(/2024–2026 Basion Wang/).length).toBeGreaterThan(0);
  });
});
