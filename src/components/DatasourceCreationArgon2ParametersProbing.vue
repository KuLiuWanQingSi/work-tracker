<!-- Create a new database step by step. -->

<template>
  <v-container>
    <v-row>
      <v-slider
        v-model="kfd_time"
        :min="10"
        :max="16000"
        :step="1"
        :label="$t('datasource_creation.kdf_target_time')"
        color="primary"
        hide-details
      >
        <template v-slot:append>
          <v-text-field
            v-model="kfd_time"
            density="compact"
            suffix="ms"
            type="number"
            style="width: 128px"
          ></v-text-field>
        </template>
      </v-slider>
    </v-row>
    <v-row>
      <div class="mx-auto" style="margin-top: -8px">
        <v-chip variant="text">{{ $t("datasource_creation.kdf_target_time_hint") }}</v-chip>
        <v-bottom-sheet inset>
          <template v-slot:activator="{ props: show_kdf_learn_more }">
            <v-chip variant="text" color="secondary" v-bind="show_kdf_learn_more">{{
              $t("action.learn_more")
            }}</v-chip>
          </template>
          <v-card>
            <v-card-title style="text-align: center;">{{ $t("datasource_creation.security.security_faqs") }}</v-card-title>
            <v-card v-for="id in ['login_time', 'probing_time', 'online_security', 'access_by_third_party', 'implement_detail']" :key="id">
              <v-card-title>{{ $t(`datasource_creation.security.${id}.question`) }}</v-card-title>
              <v-card-text>{{ $t(`datasource_creation.security.${id}.answer`) }}</v-card-text>
            </v-card>

          </v-card>
        </v-bottom-sheet>
      </div>
    </v-row>
  </v-container>
  <v-expansion-panels class="my-2">
    <v-expansion-panel :title="$t('datasource_creation.kdf_detail_control')">
      <v-expansion-panel-text>
        <v-container>
          <v-row justify="space-between">
            <v-col cols="1"><v-switch v-model="argon2_memory_enabled" color="primary"></v-switch></v-col>
            <v-col cols="11"
              ><v-text-field
                suffix="MiB"
                type="number"
                v-model="argon2_memory"
                :disabled="!argon2_memory_enabled"
                :label="$t('datasource_creation.kdf_memory')"
              ></v-text-field
            ></v-col>
          </v-row>
          <v-row justify="space-between">
            <v-col cols="1">
              <v-switch v-model="argon2_iterations_enabled" color="primary"></v-switch>
            </v-col>
            <v-col cols="11">
              <v-text-field
                type="number"
                v-model="argon2_iterations"
                :disabled="!argon2_iterations_enabled"
                :hint="$t('datasource_creation.kdf_iteration_hint')"
                :label="$t('datasource_creation.kdf_iteration')"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row justify="space-between">
            <v-col cols="1">
              <v-switch v-model="argon2_threads_enabled" color="primary"></v-switch>
            </v-col>
            <v-col cols="11">
              <v-text-field
                type="number"
                v-model="argon2_threads"
                :disabled="!argon2_threads_enabled"
                :label="$t('datasource_creation.kdf_threads')"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
  <div class="my-4">
    <v-btn
      block
      color="primary"
      @click="argon2_iterations_enabled ? validate_argon2_parameters() : probe_argon2_parameters()"
      :loading="handling_argon2_parameters"
    >
      {{
        argon2_iterations_enabled
          ? $t("datasource_creation.validate_argon2_parameters")
          : $t("datasource_creation.probe_argon2_parameters")
      }}
      <template v-slot:loader>
        <v-progress-circular indeterminate></v-progress-circular>
        <span v-if="!argon2_iterations_enabled" class="mx-2">{{ $t("message.time_taking_action") }}</span>
      </template>
    </v-btn>
    <v-range-slider
      v-if="probing_range.shown"
      disabled
      :min="probing_range.minimum"
      :max="probing_range.maximum"
      v-model="probing_range.current_range"
      thumb-size="12"
    ></v-range-slider>
  </div>
</template>

<script setup lang="ts">
import { i18n } from "@/locales";
import { argon2_hash } from "@/procedures/argon2-hash";
import { inj_DisplayNotice } from "@/types/injections";

import type { Ref, ShallowReactive } from "vue";
import { inject, ref, shallowReactive } from "vue";

const { t } = i18n.global;
const emit = defineEmits<{
  finished: [{ memory: number; iterations: number; threads: number }];
}>();
const display_notice = inject(inj_DisplayNotice)!;

// constants
const encoder = new TextEncoder();
const TestPassword = encoder.encode("password");
const TestSalt = encoder.encode("somesalt");

// target kdf time (unit: ms)
const kfd_time: Ref<number> = ref(1000);
// argon2 parameters
const DefaultArgon2Memory = Math.round(1024 * 1024 * 1024 * 1.9);
const argon2_memory_enabled: Ref<boolean> = ref(false);
const argon2_memory: Ref<number> = ref(Math.round(DefaultArgon2Memory / 1024 / 1024));

const DefaultArgon2Iterations = 1;
const argon2_iterations_enabled: Ref<boolean> = ref(false);
const argon2_iterations: Ref<number> = ref(DefaultArgon2Iterations);

const DefaultArgon2Threads = 4;
const argon2_threads_enabled: Ref<boolean> = ref(false);
const argon2_threads: Ref<number> = ref(DefaultArgon2Threads);

// if we are busy calculating argon2 parameters
const handling_argon2_parameters: Ref<boolean> = ref(false);
// range display parameters showing probing progress
const probing_range: ShallowReactive<{
  shown: boolean;
  minimum: number;
  maximum: number;
  current_range: number[];
}> = shallowReactive({
  shown: false,
  minimum: 0,
  maximum: 0,
  current_range: [0, 0],
});

// final argon2 parameters
const argon2_parameters: {
  memory: number | null;
  time: number | null;
  parallelism: number | null;
} = {
  memory: null,
  time: null,
  parallelism: null,
};

function argon2_parameters_finished() {
  handling_argon2_parameters.value = false;
  if (
    argon2_parameters.memory !== null &&
    argon2_parameters.time !== null &&
    argon2_parameters.parallelism !== null
  ) {
    argon2_memory.value = Math.round(argon2_parameters.memory / 1024 / 1024);
    argon2_iterations.value = argon2_parameters.time;
    argon2_threads.value = argon2_parameters.parallelism;
    emit("finished", {
      memory: argon2_parameters.memory,
      iterations: argon2_parameters.time,
      threads: argon2_parameters.parallelism,
    });
  }
}

function _get_fixed_argon2_parameters() {
  argon2_parameters.time = null;
  argon2_parameters.memory = null;
  argon2_parameters.parallelism = null;
  return {
    payload: TestPassword,
    salt: TestSalt,
    memory: argon2_memory_enabled.value ? Number(argon2_memory.value) * 1024 * 1024 : DefaultArgon2Memory,
    parallelism: argon2_threads_enabled.value ? Number(argon2_threads.value) : DefaultArgon2Threads,
    hash_length: 32,
  };
}

function validate_argon2_parameters() {
  handling_argon2_parameters.value = true;
  const iteration = Number(argon2_iterations.value);
  const fixed_parameters = _get_fixed_argon2_parameters();
  const { promise } = argon2_hash({
    ...fixed_parameters,
    time: iteration,
  });
  promise.then((result) => {
    if (result.succeed) {
      argon2_parameters.time = iteration;
      argon2_parameters.memory = fixed_parameters.memory;
      argon2_parameters.parallelism = fixed_parameters.parallelism;
    } else {
      display_notice(
        "error",
        t("message.error.failed_to_argon2"),
        `${result.error_code}: ${result.error_message}`
      );
    }
    argon2_parameters_finished();
  });
}

function probe_argon2_parameters() {
  handling_argon2_parameters.value = true;
  const fixed_parameters = _get_fixed_argon2_parameters();
  const timeout = Math.round(Number(kfd_time.value) + Number(kfd_time.value) * 0.1);
  const probing = (async () => {
    let lower: number = 1;
    let upper: number = -100;
    probing_range.minimum = lower;
    probing_range.maximum = -upper;
    probing_range.current_range = [lower, -upper];
    probing_range.shown = true;
    while (upper < 0 || lower < upper - 1) {
      const iterations = upper < 0 ? -upper : Math.floor((lower + upper) / 2);
      const { promise: prober, canceler } = argon2_hash({
        ...fixed_parameters,
        time: iterations,
      });
      const timeout_handler = setTimeout(canceler, timeout);
      const result = await prober;
      clearTimeout(timeout_handler);
      if (!result.succeed && result.error_code !== -1000) {
        // unexpected failure
        display_notice(
          "error",
          t("message.error.failed_to_argon2"),
          `${result.error_code}: ${result.error_message}`
        );
        return null;
      }
      if (!result.succeed) {
        // running for too long, try to decrease iterations
        upper = iterations;
        probing_range.current_range = [lower, upper];
      } else {
        lower = iterations;
        if (upper < 0) {
          upper *= 2;
          probing_range.maximum = -upper;
          probing_range.current_range = [lower, -upper];
        } else {
          probing_range.current_range = [lower, upper];
        }
      }
    }
    return Math.floor((lower + upper) / 2);
  })();
  probing.then((value) => {
    probing_range.shown = false;
    if (value !== null && value !== 0) {
      argon2_parameters.time = value;
      argon2_parameters.memory = fixed_parameters.memory;
      argon2_parameters.parallelism = fixed_parameters.parallelism;
    }
    argon2_parameters_finished();
  });
}
</script>
