import { MutationObserver, instances } from "./setup";
import { createMutationObserver, mutationObserver } from "../src";
import { createRoot } from "solid-js";
import { describe, expect, it } from "vitest";

describe("mutation-observer", () => {
  it("returns correct values", () =>
    createRoot(dispose => {
      const parent = document.createElement("div");
      const [add, { start, stop, instance, isSupported }] = createMutationObserver(
        parent,
        { childList: true },
        e => {},
      );

      expect(add).toBeInstanceOf(Function);
      expect(start).toBeInstanceOf(Function);
      expect(stop).toBeInstanceOf(Function);
      expect(instance).toBeInstanceOf(MutationObserver);
      expect([true, false]).toContain(isSupported);

      dispose();
    }));

  it("creates a new MutationObserver instance", () =>
    createRoot(dispose => {
      const prevLength = instances.length;
      const parent = document.createElement("div");
      const [, { instance }] = createMutationObserver(parent, { childList: true }, e => {});

      expect(instances.length).toBe(prevLength + 1);
      expect(instance).toBe(instances[prevLength]);

      dispose();
    }));

  it("single initial element is observed", () =>
    createRoot(dispose => {
      const config = { childList: true };
      const parent = document.createElement("div");

      const [, { instance, start, stop }] = createMutationObserver(parent, config, e => {});
      start();

      expect((instance as MutationObserver).elements[0]).toEqual([parent, config]);

      stop();
      expect((instance as MutationObserver).elements).toHaveLength(0);

      dispose();
    }));

  it("initial elements are being observed", () =>
    createRoot(dispose => {
      const config = { childList: true };

      const parent = document.createElement("div"),
        parent1 = document.createElement("div"),
        parent2 = document.createElement("div");

      const [, { instance, start, stop }] = createMutationObserver(
        [parent, parent1, parent2],
        config,
        e => {},
      );
      start();

      expect((instance as MutationObserver).elements).toEqual([
        [parent, config],
        [parent1, config],
        [parent2, config],
      ]);

      stop();
      expect((instance as MutationObserver).elements).toHaveLength(0);

      dispose();
    }));

  it("initial elements with individual configs", () =>
    createRoot(dispose => {
      const config = { childList: true },
        config1 = {},
        config2 = { attributes: true };

      const parent = document.createElement("div"),
        parent1 = document.createElement("div"),
        parent2 = document.createElement("div");

      const [, { instance, start, stop }] = createMutationObserver(
        [
          [parent, config],
          [parent1, config1],
          [parent2, config2],
        ],
        e => {},
      );
      start();

      expect((instance as MutationObserver).elements).toEqual([
        [parent, config],
        [parent1, config1],
        [parent2, config2],
      ]);

      stop();
      expect((instance as MutationObserver).elements).toHaveLength(0);

      dispose();
    }));

  it("observe method", () =>
    createRoot(dispose => {
      const config = { childList: true },
        config1 = {},
        config2 = { attributes: true };

      const parent = document.createElement("div"),
        parent1 = document.createElement("div"),
        parent2 = document.createElement("div"),
        parent3 = document.createElement("div");

      const [add, { instance, start, stop }] = createMutationObserver(parent, config, e => {});
      start();
      expect((instance as MutationObserver).elements[0]).toEqual([parent, config]);

      add(parent1, config1);
      expect((instance as MutationObserver).elements[1]).toEqual([parent1, config1]);

      add(parent2);
      expect((instance as MutationObserver).elements[2]).toEqual([parent2, config]);

      add(parent3, () => config2);
      expect((instance as MutationObserver).elements[3]).toEqual([parent3, config2]);

      stop();
      expect((instance as MutationObserver).elements).toHaveLength(0);

      dispose();
    }));

  it("standalone mutationObserver directive", () =>
    createRoot(dispose => {
      const config = { childList: true };
      const parent = document.createElement("div");

      mutationObserver(parent, () => [config, () => {}]);

      expect(instances[instances.length - 1].elements).toEqual([[parent, config]]);

      dispose();
    }));

  it("fire mutation events", () =>
    createRoot(async dispose => {
      const config = { childList: true };
      const parent = document.createElement("div");

      let count = 0;
      const [, { start }] = createMutationObserver(parent, config, e => {
        count++;
      });
      start();

      instances[instances.length - 1].__simulateMutation();

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(count).toBe(1);

      dispose();
    }));

  it("stop firing on stop", () =>
    createRoot(async dispose => {
      const config = { childList: true };
      const parent = document.createElement("div");

      let count = 0;
      const [, { start, stop }] = createMutationObserver(parent, config, e => {
        count++;
      });
      start();

      stop();

      instances[instances.length - 1].__simulateMutation();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(count).toBe(0);

      dispose();
    }));

  it("stop firing on dispose", () =>
    createRoot(async dispose => {
      const config = { childList: true };
      const parent = document.createElement("div");

      let count = 0;
      const [, { start }] = createMutationObserver(parent, config, e => {
        count++;
      });
      start();

      dispose();

      instances[instances.length - 1].__simulateMutation();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(count).toBe(0);
    }));

  it("stop firing on stop while still have pending records", () =>
    createRoot(async dispose => {
      const config = { childList: true };
      const parent = document.createElement("div");

      let count = 0;
      const [, { start, stop }] = createMutationObserver(parent, config, e => {
        count++;
      });
      start();

      instances[instances.length - 1].__simulateMutation();

      stop();

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(count).toBe(0);

      dispose();
    }));
});
