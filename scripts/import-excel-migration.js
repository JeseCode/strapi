#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const XLSX = require("xlsx");
const { createStrapi } = require("@strapi/strapi");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_EXCEL_PATH = path.resolve(
  REPO_ROOT,
  "CUENTAS GENERADAS cel.xlsm",
);
const DEFAULT_REPORT_DIR = path.resolve(__dirname, "..", "migration-reports");
const STRAPI_APP_DIR = path.resolve(__dirname, "..");
const MIGRATION_USER_NAME = "Migracion Excel";
const SYNTHETIC_EMAIL_DOMAIN = "excel-migration.local";
const MAX_CLIENT_PHONE_LENGTH = 20;
const MAX_CLIENT_NAME_LENGTH = 100;
const MAX_PROFILE_NAME_LENGTH = 100;
const MAX_PLAN_NAME_LENGTH = 100;
const MAX_PAYMENT_METHOD_LENGTH = 50;

const SERVICE_DEFINITIONS = {
  netflix: {
    name: "Netflix",
    color: "#E50914",
    description: "Migrado desde Excel",
    aliases: ["netflix", "netfl!x"],
  },
  disneyplus: {
    name: "Disney+",
    color: "#113CCF",
    description: "Migrado desde Excel",
    aliases: ["disney", "disney+", "disneyplus"],
  },
  amazonprime: {
    name: "Amazon Prime",
    color: "#00A8E1",
    description: "Migrado desde Excel",
    aliases: ["amazon", "prime", "prime video", "amazon prime"],
  },
  hbomax: {
    name: "HBO Max",
    color: "#5B21B6",
    description: "Migrado desde Excel",
    aliases: ["hbo", "max", "hbo max"],
  },
  plex: {
    name: "Plex",
    color: "#F59E0B",
    description: "Migrado desde Excel",
    aliases: ["plex"],
  },
  jellyfin: {
    name: "Jellyfin",
    color: "#7C3AED",
    description: "Migrado desde Excel",
    aliases: ["jellyfin"],
  },
  crunchyroll: {
    name: "Crunchyroll",
    color: "#F97316",
    description: "Migrado desde Excel",
    aliases: ["crunchyroll", "crunchy", "crun"],
  },
  paramountplus: {
    name: "Paramount+",
    color: "#1D4ED8",
    description: "Migrado desde Excel",
    aliases: ["paramount+", "paramount", "para"],
  },
  vix: {
    name: "VIX",
    color: "#EA580C",
    description: "Migrado desde Excel",
    aliases: ["vix", "vix+"],
  },
  appletv: {
    name: "Apple TV+",
    color: "#111827",
    description: "Migrado desde Excel",
    aliases: ["apple", "apple tv", "apple tv+"],
  },
  iptv: {
    name: "IPTV",
    color: "#0F766E",
    description: "Migrado desde Excel",
    aliases: ["iptv", "i-p-t-v"],
  },
  youtubepremium: {
    name: "YouTube Premium",
    color: "#DC2626",
    description: "Migrado desde Excel",
    aliases: ["youtube", "yt premium", "youtube premium", "yt"],
  },
  spotify: {
    name: "Spotify",
    color: "#16A34A",
    description: "Migrado desde Excel",
    aliases: ["spotify"],
  },
  canva: {
    name: "Canva",
    color: "#06B6D4",
    description: "Migrado desde Excel",
    aliases: ["canva"],
  },
  chatgpt: {
    name: "ChatGPT",
    color: "#10A37F",
    description: "Migrado desde Excel",
    aliases: ["chatgpt", "gpt", "openai"],
  },
};

const SHEET_CONFIGS = {
  NETFLIX: {
    kind: "operational",
    headerRow: 3,
    loginCol: 2,
    passwordCol: 3,
    clientCol: 4,
    pinCol: 5,
    deviceCol: 6,
    activationCol: 7,
    expirationCol: 8,
    remainingCol: 9,
    phoneCol: 10,
    priceCol: 11,
    flags: {
      seguimientoCol: 13,
      cobrarCol: 14,
      reenviarCol: 15,
      renovacionCol: 16,
      ventaCol: 17,
    },
    planCol: 18,
    extraStartCol: 18,
    serviceResolver: () => ({ slug: "netflix", reason: "sheet-default" }),
  },
  "DISNEY+": {
    kind: "operational",
    headerRow: 3,
    loginCol: 2,
    passwordCol: 3,
    clientCol: 4,
    pinCol: 5,
    activationCol: 6,
    expirationCol: 7,
    remainingCol: 8,
    phoneCol: 9,
    priceCol: 10,
    flags: {
      seguimientoCol: 12,
      cobrarCol: 13,
      reenviarCol: 14,
      renovacionCol: 15,
      ventaCol: 16,
    },
    extraStartCol: 17,
    serviceResolver: () => ({ slug: "disneyplus", reason: "sheet-default" }),
  },
  AMAZON: {
    kind: "operational",
    headerRow: 3,
    loginCol: 2,
    passwordCol: 3,
    clientCol: 4,
    pinCol: 5,
    activationCol: 6,
    expirationCol: 7,
    remainingCol: 8,
    phoneCol: 9,
    priceCol: 10,
    flags: {
      seguimientoCol: 12,
      cobrarCol: 13,
      reenviarCol: 14,
      renovacionCol: 15,
      ventaCol: 16,
    },
    extraStartCol: 17,
    serviceResolver: () => ({ slug: "amazonprime", reason: "sheet-default" }),
  },
  HBO: {
    kind: "operational",
    headerRow: 3,
    loginCol: 2,
    passwordCol: 3,
    clientCol: 4,
    pinCol: 5,
    activationCol: 6,
    expirationCol: 7,
    remainingCol: 8,
    phoneCol: 9,
    priceCol: 10,
    flags: {
      seguimientoCol: 12,
      cobrarCol: 13,
      reenviarCol: 14,
      renovacionCol: 15,
      ventaCol: 16,
    },
    extraStartCol: 17,
    serviceResolver: () => ({ slug: "hbomax", reason: "sheet-default" }),
  },
  "PLEX y JELLYFIN": {
    kind: "operational",
    headerRow: 3,
    loginCol: 2,
    passwordCol: 3,
    clientCol: 4,
    activationCol: 5,
    expirationCol: 6,
    remainingCol: 7,
    phoneCol: 8,
    priceCol: 9,
    flags: {
      seguimientoCol: 11,
      cobrarCol: 12,
      reenviarCol: 13,
      renovacionCol: 14,
      ventaCol: 15,
    },
    extraStartCol: 16,
    serviceResolver: (rowText) => {
      if (/jellyfin/.test(rowText)) {
        return { slug: "jellyfin", reason: "row-alias" };
      }

      return { slug: "plex", reason: "sheet-default" };
    },
  },
  "CRUN - PARA - VIX - APPLE": {
    kind: "operational",
    headerRow: 3,
    loginCol: 2,
    passwordCol: 3,
    clientCol: 4,
    activationCol: 5,
    expirationCol: 6,
    remainingCol: 7,
    phoneCol: 8,
    priceCol: 9,
    flags: {
      seguimientoCol: 11,
      cobrarCol: 12,
      reenviarCol: 13,
      renovacionCol: 14,
      ventaCol: 15,
    },
    extraStartCol: 16,
    serviceResolver: (rowText) => {
      if (/paramount/.test(rowText)) {
        return { slug: "paramountplus", reason: "row-alias" };
      }
      if (/\bvix\b/.test(rowText)) {
        return { slug: "vix", reason: "row-alias" };
      }
      if (/apple/.test(rowText)) {
        return { slug: "appletv", reason: "row-alias" };
      }

      return { slug: "crunchyroll", reason: "sheet-default" };
    },
  },
  "I-P-T-V": {
    kind: "operational",
    headerRow: 3,
    loginCol: 2,
    passwordCol: 3,
    clientCol: 4,
    activationCol: 5,
    expirationCol: 6,
    remainingCol: 7,
    phoneCol: 8,
    priceCol: 9,
    flags: {
      seguimientoCol: 11,
      cobrarCol: 12,
      reenviarCol: 13,
      renovacionCol: 14,
      ventaCol: 15,
    },
    extraStartCol: 16,
    serviceResolver: () => ({ slug: "iptv", reason: "sheet-default" }),
  },
  YOUTUBE: {
    kind: "operational",
    headerRow: 3,
    loginCol: 2,
    passwordCol: 3,
    clientCol: 4,
    activationCol: 5,
    expirationCol: 6,
    remainingCol: 7,
    phoneCol: 8,
    priceCol: 9,
    flags: {
      ventaCol: 11,
    },
    profileTokenCol: 12,
    fallbackExpirationCol: 12,
    fallbackRemainingCol: 13,
    extraStartCol: 12,
    serviceResolver: () => ({
      slug: "youtubepremium",
      reason: "sheet-default",
    }),
  },
  SPOTIFY: {
    kind: "operational",
    headerRow: 3,
    loginCol: 2,
    passwordCol: 3,
    clientCol: 4,
    activationCol: 5,
    expirationCol: 6,
    remainingCol: 7,
    phoneCol: 8,
    priceCol: 9,
    flags: {
      seguimientoCol: 11,
      cobrarCol: 12,
      reenviarCol: 13,
      renovacionCol: 14,
      ventaCol: 15,
    },
    profileTokenCol: 16,
    extraStartCol: 16,
    serviceResolver: () => ({ slug: "spotify", reason: "sheet-default" }),
  },
  "CANVA y CHATGPT": {
    kind: "operational",
    headerRow: 3,
    loginCol: 2,
    passwordCol: 3,
    clientCol: 4,
    activationCol: 5,
    expirationCol: 6,
    remainingCol: 7,
    phoneCol: 8,
    priceCol: 9,
    flags: {
      seguimientoCol: 11,
      cobrarCol: 12,
      reenviarCol: 13,
      renovacionCol: 14,
      ventaCol: 15,
    },
    fallbackExpirationCol: 16,
    fallbackRemainingCol: 17,
    extraStartCol: 16,
    serviceResolver: (rowText) => {
      if (/chatgpt|gpt|business|openai/.test(rowText)) {
        return { slug: "chatgpt", reason: "row-alias" };
      }

      return { slug: "canva", reason: "sheet-default" };
    },
  },
  CORREOS: {
    kind: "inventory",
    headerRow: 2,
    identifierCol: 1,
    passwordCol: 2,
    serviceCol: 4,
    category: "correos",
  },
  HENRY: {
    kind: "inventory",
    headerRow: 3,
    serviceCol: 1,
    clientCol: 2,
    identifierCol: 3,
    passwordCol: 4,
    pinCol: 5,
    activationCol: 6,
    expirationCol: 7,
    phoneCol: 9,
    priceCol: 10,
    costCol: 11,
    category: "henry",
  },
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const generatedAt = new Date().toISOString();

  ensureExcelFile(options.file);

  const plan = buildMigrationPlan(options.file);
  const report = {
    mode: options.mode,
    file: options.file,
    generatedAt,
    summary: buildSummary(plan),
    sheets: plan.sheetSummaries,
    review: plan.review,
  };

  ensureDir(path.dirname(options.report));

  if (options.mode === "inspect" || options.mode === "dry-run") {
    fs.writeFileSync(options.report, JSON.stringify(report, null, 2));
    printSummary(report.summary, options.report, options.mode);
    return;
  }

  const applyResult = await applyMigration(plan);
  const finalReport = {
    ...report,
    apply: applyResult,
  };

  fs.writeFileSync(options.report, JSON.stringify(finalReport, null, 2));
  printSummary(finalReport.summary, options.report, options.mode, applyResult);
}

function parseArgs(argv) {
  const args = [...argv];
  const mode =
    args[0] && !args[0].startsWith("--") ? args.shift() : "inspect";

  if (!["inspect", "dry-run", "apply"].includes(mode)) {
    throw new Error(`Modo no soportado: ${mode}`);
  }

  const options = {
    mode,
    file: DEFAULT_EXCEL_PATH,
    report: path.resolve(
      DEFAULT_REPORT_DIR,
      `excel-migration-${mode}-${Date.now()}.json`,
    ),
  };

  while (args.length > 0) {
    const token = args.shift();
    const value = args.shift();

    if (!value) {
      throw new Error(`Falta valor para el argumento ${token}`);
    }

    if (token === "--file") {
      options.file = path.resolve(value);
      continue;
    }

    if (token === "--report") {
      options.report = path.resolve(value);
      continue;
    }

    throw new Error(`Argumento no soportado: ${token}`);
  }

  return options;
}

function ensureExcelFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`No se encontro el archivo Excel: ${filePath}`);
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readSheetRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: null,
    blankrows: false,
  });
}

function buildMigrationPlan(filePath) {
  const workbook = XLSX.readFile(filePath, {
    cellFormula: true,
    cellDates: false,
  });
  const state = {
    filePath,
    services: new Map(),
    plans: new Map(),
    clients: new Map(),
    accounts: new Map(),
    transactions: [],
    inventory: [],
    review: [],
    sheetSummaries: [],
  };

  for (const sheetName of workbook.SheetNames) {
    const config = SHEET_CONFIGS[sheetName];
    const rows = readSheetRows(workbook, sheetName);

    if (!config) {
      state.sheetSummaries.push({
        sheet: sheetName,
        type: "ignored",
        rows: rows.length,
        imported: 0,
        review: 0,
      });
      continue;
    }

    if (config.kind === "inventory") {
      processInventorySheet(state, sheetName, rows, config);
      continue;
    }

    if (config.kind === "operational") {
      processOperationalSheet(state, sheetName, rows, config);
    }
  }

  finalizeServicesAndPlans(state);
  return state;
}

function processInventorySheet(state, sheetName, rows, config) {
  const startRow = (config.headerRow || 1) + 1;
  let imported = 0;
  let reviewCount = 0;

  for (let rowIndex = startRow; rowIndex <= rows.length; rowIndex += 1) {
    const row = rows[rowIndex - 1] || [];
    const identifier = normalizeCell(getCell(row, config.identifierCol));

    if (!identifier) {
      continue;
    }

    const serviceSeed =
      resolveServiceFromRowText(
        normalizeForSearch(getCell(row, config.serviceCol) || ""),
      ) || null;

    if (serviceSeed) {
      ensureServiceDraft(state, serviceSeed.slug, {
        sheetName,
        rowIndex,
      });
    }

    const entry = {
      key: `${sheetName}:${rowIndex}:${normalizeIdentifier(identifier)}`,
      identificador_acceso: identifier,
      email: isLikelyEmail(identifier) ? identifier.toLowerCase() : null,
      password: normalizeCell(getCell(row, config.passwordCol)) || null,
      servicioSlug: serviceSeed ? serviceSeed.slug : null,
      servicio_origen:
        normalizeCell(getCell(row, config.serviceCol)) || serviceSeed?.name || null,
      estado_vinculacion: "inventariada",
      categoria_origen: config.category,
      notas: buildInventoryNotes(row, config),
      source_sheet: sheetName,
      source_row: rowIndex,
      legacy_excel: buildLegacyExcel(sheetName, rowIndex, row, {
        category: config.category,
      }),
    };

    if (sheetName === "HENRY" && !serviceSeed) {
      entry.estado_vinculacion = "revision";
      reviewCount += 1;
      state.review.push({
        sheet: sheetName,
        row: rowIndex,
        reason: "Servicio no reconocido en hoja HENRY",
        rowSnapshot: sanitizeRow(row),
      });
    }

    state.inventory.push(entry);
    imported += 1;
  }

  state.sheetSummaries.push({
    sheet: sheetName,
    type: "inventory",
    rows: rows.length,
    imported,
    review: reviewCount,
  });
}

function processOperationalSheet(state, sheetName, rows, config) {
  const blocks = splitIntoBlocks(rows, config);
  const sheetToday = extractSheetToday(rows);
  let importedAccounts = 0;
  let importedProfiles = 0;
  let importedInventory = 0;
  let reviewCount = 0;

  for (const block of blocks) {
    const parsed = parseOperationalBlock(sheetName, block, config, {
      sheetToday,
    });

    if (parsed.kind === "review") {
      reviewCount += 1;
      state.review.push(parsed.reviewItem);
      continue;
    }

    if (parsed.kind === "inventory") {
      if (parsed.serviceSlug) {
        ensureServiceDraft(state, parsed.serviceSlug, {
          sheetName,
          rowIndex: parsed.source_row,
        });
      }

      state.inventory.push(parsed.entry);
      importedInventory += 1;
      continue;
    }

    commitOperationalAccount(state, parsed);
    importedAccounts += 1;
    importedProfiles += parsed.profiles.length;
  }

  state.sheetSummaries.push({
    sheet: sheetName,
    type: "operational",
    rows: rows.length,
    importedAccounts,
    importedProfiles,
    importedInventory,
    review: reviewCount,
  });
}

function splitIntoBlocks(rows, config) {
  const blocks = [];
  const startRow = (config.headerRow || 1) + 1;
  let current = null;

  for (let rowIndex = startRow; rowIndex <= rows.length; rowIndex += 1) {
    const row = rows[rowIndex - 1] || [];

    if (isRowEmpty(row)) {
      continue;
    }

    const startsBlock = Boolean(
      normalizeCell(getCell(row, config.loginCol)) ||
        normalizeCell(getCell(row, config.passwordCol)),
    );

    if (startsBlock || !current) {
      if (current) {
        blocks.push(current);
      }

      current = {
        startRow: rowIndex,
        rows: [],
      };
    }

    current.rows.push({
      rowIndex,
      values: row,
    });
  }

  if (current) {
    blocks.push(current);
  }

  return blocks;
}

function parseOperationalBlock(sheetName, block, config, sheetContext) {
  const firstRow = block.rows[0].values;
  const blockText = normalizeForSearch(
    flattenRowText(block.rows.map((item) => item.values)),
  );
  const serviceResolution = config.serviceResolver(blockText);
  const identifierRaw = firstMeaningfulValue(block.rows, config.loginCol);
  const passwordRaw = firstMeaningfulValue(block.rows, config.passwordCol);

  if (!identifierRaw) {
    return {
      kind: "review",
      reviewItem: {
        sheet: sheetName,
        row: block.startRow,
        reason: "Bloque sin identificador de acceso",
        rowSnapshot: sanitizeRow(firstRow),
      },
    };
  }

  if (!serviceResolution?.slug) {
    return {
      kind: "review",
      reviewItem: {
        sheet: sheetName,
        row: block.startRow,
        reason: "No se pudo resolver el servicio del bloque",
        rowSnapshot: sanitizeRow(firstRow),
      },
    };
  }

  const profiles = [];
  const extraNotes = [];
  const planNames = new Set();
  let slotSequence = 0;

  for (const rowItem of block.rows) {
    const candidate = parseProfileRow(
      sheetName,
      rowItem,
      config,
      serviceResolution.slug,
      sheetContext,
      slotSequence,
    );

    if (candidate.skip) {
      if (candidate.notes) {
        extraNotes.push(candidate.notes);
      }
      continue;
    }

    slotSequence = candidate.nextSlotSequence;

    if (candidate.planName) {
      planNames.add(candidate.planName);
    }

    if (candidate.notes) {
      extraNotes.push(candidate.notes);
    }

    if (candidate.profile) {
      profiles.push(candidate.profile);
    }
  }

  if (profiles.length === 0) {
    const inventoryIdentifier = normalizeCell(identifierRaw);

    return {
      kind: "inventory",
      serviceSlug: serviceResolution.slug,
      source_row: block.startRow,
      entry: {
        key: `${sheetName}:${block.startRow}:${normalizeIdentifier(inventoryIdentifier)}`,
        identificador_acceso: inventoryIdentifier,
        email: isLikelyEmail(inventoryIdentifier)
          ? inventoryIdentifier.toLowerCase()
          : null,
        password: normalizeCell(passwordRaw) || null,
        servicioSlug: serviceResolution.slug,
        servicio_origen: SERVICE_DEFINITIONS[serviceResolution.slug]?.name || null,
        estado_vinculacion: "inventariada",
        categoria_origen: "operativa_sin_cliente",
        notas: compactNotes([
          `Cuenta sin cliente asignado detectada en ${sheetName}`,
          ...extraNotes,
        ]),
        source_sheet: sheetName,
        source_row: block.startRow,
        legacy_excel: buildLegacyExcel(sheetName, block.startRow, firstRow, {
          blockRows: block.rows.map((item) => ({
            row: item.rowIndex,
            values: sanitizeRow(item.values),
          })),
          serviceReason: serviceResolution.reason,
        }),
      },
    };
  }

  const accountDates = resolveAccountDates(profiles, sheetContext.sheetToday);
  const accountPrice = resolveAccountPrice(profiles);
  const planName = pickBestPlanName(planNames);
  const identifier = normalizeCell(identifierRaw);
  const isRealEmail = isLikelyEmail(identifier);

  return {
    kind: "account",
    key: `${serviceResolution.slug}::${normalizeIdentifier(identifier)}`,
    serviceSlug: serviceResolution.slug,
    serviceReason: serviceResolution.reason,
    planName,
    identifier,
    email: isRealEmail
      ? identifier.toLowerCase()
      : buildSyntheticEmail(identifier, serviceResolution.slug, block.startRow),
    password: normalizeCell(passwordRaw) || "SIN_PASSWORD_MIGRADA",
    profiles,
    fechaInicio:
      accountDates.fechaInicio || getDateString(sheetContext.sheetToday || new Date()),
    fechaVencimiento:
      accountDates.fechaVencimiento ||
      addDaysToDateString(
        accountDates.fechaInicio ||
          getDateString(sheetContext.sheetToday || new Date()),
        30,
      ),
    precio: accountPrice,
    notas: compactNotes(extraNotes),
    source_sheet: sheetName,
    source_row: block.startRow,
    legacy_excel: buildLegacyExcel(sheetName, block.startRow, firstRow, {
      blockRows: block.rows.map((item) => ({
        row: item.rowIndex,
        values: sanitizeRow(item.values),
      })),
      serviceReason: serviceResolution.reason,
      accountPrice,
    }),
  };
}

function parseProfileRow(
  sheetName,
  rowItem,
  config,
  serviceSlug,
  sheetContext,
  slotSequence,
) {
  const row = rowItem.values;
  const rawClient = normalizeCell(getCell(row, config.clientCol));
  const rawPhone = getCell(row, config.phoneCol);
  const rawPrice = getCell(row, config.priceCol);
  const flags = parseFlags(row, config.flags || {});
  const hasMeaningfulClientData =
    Boolean(rawClient) ||
    Boolean(normalizePhone(rawPhone)) ||
    Boolean(parseMoney(rawPrice)) ||
    Boolean(flags.hasAnyFlag);

  if (!hasMeaningfulClientData) {
    return {
      skip: true,
      nextSlotSequence: slotSequence,
      notes: buildLooseRowNotes(row, config),
    };
  }

  const clientInfo = buildClientDraft(
    sheetName,
    rowItem.rowIndex,
    rawClient,
    rawPhone,
  );

  if (!clientInfo) {
    return {
      skip: true,
      nextSlotSequence: slotSequence,
      notes: buildLooseRowNotes(row, config),
    };
  }

  let slotNumber =
    parseSlotFromClient(rawClient) ||
    parseSlotToken(getCell(row, config.profileTokenCol)) ||
    null;

  if (slotNumber === null) {
    slotNumber = slotSequence + 1;
  }

  const nextSlotSequence = Math.max(slotSequence, slotNumber);
  const pin =
    normalizeCell(getCell(row, config.pinCol)) ||
    buildGeneratedPin(sheetName, rowItem.rowIndex, slotNumber);
  const dates = resolveProfileDates(row, config, sheetContext);
  const profilePrice = parseMoney(rawPrice);
  const planName = extractPlanName(row, config);
  const maybePhoneNote =
    rawPhone && !normalizePhone(rawPhone) ? normalizeCell(rawPhone) : null;
  const notes = compactNotes([
    maybePhoneNote ? `Valor no interpretable como telefono: ${maybePhoneNote}` : null,
    buildLooseRowNotes(row, config),
  ]);

  return {
    skip: false,
    nextSlotSequence,
    planName,
    notes,
    profile: {
      client: clientInfo,
      slotNumber,
      pin,
      tipo_dispositivo: inferDeviceType(getCell(row, config.deviceCol), notes),
      fecha_activacion:
        dates.fechaActivacion ||
        getDateString(sheetContext.sheetToday || new Date()),
      fecha_vencimiento:
        dates.fechaVencimiento ||
        addDaysToDateString(
          dates.fechaActivacion || getDateString(sheetContext.sheetToday || new Date()),
          30,
        ),
      precio_individual: profilePrice ?? 0,
      requiere_seguimiento: flags.requiereSeguimiento,
      requiere_cobro: flags.requiereCobro,
      requiere_reenvio: flags.requiereReenvio,
      renovado_en_excel: flags.renovadoEnExcel,
      nombre_perfil: buildProfileName(slotNumber, clientInfo.nombre),
      transaction: buildTransactionDraft(
        row,
        rowItem.rowIndex,
        config,
        flags,
        profilePrice,
        dates,
      ),
      source_sheet: sheetName,
      source_row: rowItem.rowIndex,
      notas: notes,
      legacy_excel: buildLegacyExcel(sheetName, rowItem.rowIndex, row, {
        serviceSlug,
        flags,
      }),
    },
  };
}

function buildClientDraft(sheetName, rowIndex, rawClient, rawPhone) {
  const normalizedClient = normalizeCell(rawClient);
  const parsed = parseClientDescriptor(normalizedClient);
  const phone = normalizePhone(rawPhone);
  const email = isLikelyEmail(parsed.nombre) ? parsed.nombre.toLowerCase() : null;
  const cleanName = parsed.nombre || email || null;

  if (!cleanName && !phone) {
    return null;
  }

  const nombre = clampText(
    cleanName || `Cliente migrado ${sheetName} ${rowIndex}`,
    MAX_CLIENT_NAME_LENGTH,
  );
  const telefono = phone || buildSyntheticClientPhone(sheetName, rowIndex);

  return {
    dedupeKey: phone
      ? `phone:${phone}`
      : email
        ? `email:${email}`
        : `name:${slugify(nombre)}`,
    nombre,
    email,
    telefono,
    estado: "activo",
    notas: null,
    source_sheet: sheetName,
    source_row: rowIndex,
    legacy_excel: {
      raw_client: normalizedClient || null,
      raw_phone: normalizeCell(rawPhone) || null,
    },
  };
}

function parseClientDescriptor(rawClient) {
  const text = normalizeCell(rawClient);

  if (!text) {
    return {
      slotNumber: null,
      nombre: null,
    };
  }

  const match = text.match(/^\s*(\d+)\s*[-.)]?\s*(.*)$/);

  if (match) {
    return {
      slotNumber: Number.parseInt(match[1], 10),
      nombre: normalizeCell(match[2]) || null,
    };
  }

  return {
    slotNumber: null,
    nombre: text,
  };
}

function parseSlotFromClient(rawClient) {
  return parseClientDescriptor(rawClient).slotNumber;
}

function parseSlotToken(value) {
  const token = normalizeCell(value);

  if (!token) {
    return null;
  }

  const familyMatch = token.match(/[fp]\s*(\d+)/i);
  if (familyMatch) {
    return Number.parseInt(familyMatch[1], 10);
  }

  if (/^\d+$/.test(token)) {
    return Number.parseInt(token, 10);
  }

  return null;
}

function parseFlags(row, flagsConfig) {
  const seguimiento = isTruthyFlag(getCell(row, flagsConfig.seguimientoCol));
  const cobrar = isTruthyFlag(getCell(row, flagsConfig.cobrarCol));
  const reenviar = isTruthyFlag(getCell(row, flagsConfig.reenviarCol));
  const renovacion = isTruthyFlag(getCell(row, flagsConfig.renovacionCol));
  const venta = isTruthyFlag(getCell(row, flagsConfig.ventaCol));

  return {
    requiereSeguimiento: seguimiento,
    requiereCobro: cobrar,
    requiereReenvio: reenviar,
    renovadoEnExcel: renovacion,
    ventaMarcada: venta,
    hasAnyFlag: seguimiento || cobrar || reenviar || renovacion || venta,
  };
}

function buildTransactionDraft(row, rowIndex, config, flags, monto, dates) {
  if (!flags.ventaMarcada && !flags.renovadoEnExcel && !(monto > 0)) {
    return null;
  }

  const extraValues = collectExtraValues(row, config.extraStartCol);
  const explicitDate = extraValues.find((value) => parseExcelDate(value));
  const metodoPago = extraValues.find((value) => {
    const normalized = normalizeCell(value);
    return normalized && !parseExcelDate(normalized) && !looksLikeNumeric(normalized);
  });

  return {
    monto: monto ?? 0,
    tipo: flags.renovadoEnExcel ? "renovacion" : "venta",
    estado: "completada",
    fecha:
      explicitDate ||
      dates.fechaActivacion ||
      dates.fechaVencimiento ||
      getDateString(new Date()),
    metodo_pago: clampText(metodoPago, MAX_PAYMENT_METHOD_LENGTH),
    notas: compactNotes([
      flags.requiereCobro ? "Marcada para cobrar en Excel" : null,
      flags.requiereReenvio ? "Marcada para reenvio en Excel" : null,
      flags.requiereSeguimiento ? "Marcada para seguimiento en Excel" : null,
    ]),
    source_row: rowIndex,
  };
}

function resolveProfileDates(row, config, sheetContext) {
  const explicitStart = parseExcelDate(getCell(row, config.activationCol));
  const explicitEnd = parseExcelDate(getCell(row, config.expirationCol));
  const fallbackEnd = parseExcelDate(getCell(row, config.fallbackExpirationCol));
  const remaining = parseInteger(getCell(row, config.remainingCol));
  const fallbackRemaining = parseInteger(getCell(row, config.fallbackRemainingCol));
  const today = sheetContext.sheetToday || new Date();

  let fechaActivacion = explicitStart;
  let fechaVencimiento = explicitEnd || fallbackEnd;

  if (!fechaVencimiento && fallbackRemaining !== null) {
    fechaVencimiento = addDaysToDateString(getDateString(today), fallbackRemaining);
  }

  if (!fechaVencimiento && fechaActivacion && remaining !== null) {
    fechaVencimiento = addDaysToDateString(fechaActivacion, remaining);
  }

  if (!fechaActivacion && fechaVencimiento && (remaining !== null || fallbackRemaining !== null)) {
    fechaActivacion = addDaysToDateString(
      fechaVencimiento,
      -1 * (remaining ?? fallbackRemaining),
    );
  }

  if (!fechaActivacion && fechaVencimiento) {
    fechaActivacion = addDaysToDateString(fechaVencimiento, -30);
  }

  if (!fechaVencimiento && fechaActivacion) {
    fechaVencimiento = addDaysToDateString(fechaActivacion, 30);
  }

  return {
    fechaActivacion,
    fechaVencimiento,
  };
}

function resolveAccountDates(profiles, sheetToday) {
  const starts = profiles
    .map((profile) => profile.fecha_activacion)
    .filter(Boolean)
    .sort();
  const ends = profiles
    .map((profile) => profile.fecha_vencimiento)
    .filter(Boolean)
    .sort();

  return {
    fechaInicio: starts[0] || getDateString(sheetToday || new Date()),
    fechaVencimiento: ends[ends.length - 1] || null,
  };
}

function resolveAccountPrice(profiles) {
  const prices = profiles
    .map((profile) => Number(profile.precio_individual))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (prices.length === 0) {
    return 0;
  }

  return Number(prices.reduce((total, value) => total + value, 0).toFixed(2));
}

function commitOperationalAccount(state, parsed) {
  ensureServiceDraft(state, parsed.serviceSlug, {
    sheetName: parsed.source_sheet,
    rowIndex: parsed.source_row,
  });

  if (parsed.planName) {
    ensurePlanDraft(state, parsed.planName, parsed.serviceSlug, {
      sheetName: parsed.source_sheet,
      rowIndex: parsed.source_row,
    });
  }

  const account = getOrCreateAccountDraft(state, parsed);

  for (const profile of parsed.profiles) {
    const client = getOrCreateClientDraft(state, profile.client);

    if (!account.primaryClientKey) {
      account.primaryClientKey = client.key;
    }

    addProfileToAccount(account, {
      ...profile,
      clientKey: client.key,
    });

    account.priceCandidates.push(Number(profile.precio_individual) || 0);

    if (profile.transaction) {
      state.transactions.push({
        ...profile.transaction,
        accountKey: account.key,
        clientKey: client.key,
        source_sheet: profile.source_sheet,
        source_row: profile.source_row,
        legacy_excel: profile.legacy_excel,
      });
    }
  }
}

function getOrCreateAccountDraft(state, parsed) {
  const existing = state.accounts.get(parsed.key);

  if (existing) {
    existing.legacy_excel.merged_blocks = existing.legacy_excel.merged_blocks || [];
    existing.legacy_excel.merged_blocks.push({
      sheet: parsed.source_sheet,
      row: parsed.source_row,
    });
    existing.notas = compactNotes([existing.notas, parsed.notas]);
    existing.fechaInicio =
      existing.fechaInicio && existing.fechaInicio < parsed.fechaInicio
        ? existing.fechaInicio
        : parsed.fechaInicio;
    existing.fechaVencimiento =
      existing.fechaVencimiento && existing.fechaVencimiento > parsed.fechaVencimiento
        ? existing.fechaVencimiento
        : parsed.fechaVencimiento;
    existing.plan = existing.plan || clampText(parsed.planName, MAX_PLAN_NAME_LENGTH);
    return existing;
  }

  const account = {
    key: parsed.key,
    serviceSlug: parsed.serviceSlug,
    plan: clampText(parsed.planName, MAX_PLAN_NAME_LENGTH),
    identificador_cuenta: parsed.identifier,
    email: parsed.email,
    password: parsed.password,
    fechaInicio: parsed.fechaInicio,
    fechaVencimiento: parsed.fechaVencimiento,
    precio: parsed.precio,
    notas: parsed.notas || null,
    source_sheet: parsed.source_sheet,
    source_row: parsed.source_row,
    legacy_excel: parsed.legacy_excel,
    profiles: [],
    primaryClientKey: null,
    priceCandidates: [],
  };

  state.accounts.set(parsed.key, account);
  return account;
}

function addProfileToAccount(account, profile) {
  const duplicate = account.profiles.find(
    (existing) =>
      existing.clientKey === profile.clientKey &&
      existing.slotNumber === profile.slotNumber,
  );

  if (duplicate) {
    duplicate.requiere_seguimiento =
      duplicate.requiere_seguimiento || profile.requiere_seguimiento;
    duplicate.requiere_cobro =
      duplicate.requiere_cobro || profile.requiere_cobro;
    duplicate.requiere_reenvio =
      duplicate.requiere_reenvio || profile.requiere_reenvio;
    duplicate.renovado_en_excel =
      duplicate.renovado_en_excel || profile.renovado_en_excel;
    duplicate.notas = compactNotes([duplicate.notas, profile.notas]);
    return;
  }

  account.profiles.push(profile);
}

function getOrCreateClientDraft(state, clientDraft) {
  const existing = state.clients.get(clientDraft.dedupeKey);

  if (existing) {
    existing.nombre = clampText(
      pickLongerText(existing.nombre, clientDraft.nombre),
      MAX_CLIENT_NAME_LENGTH,
    );
    existing.email = existing.email || clientDraft.email || null;
    existing.notas = compactNotes([existing.notas, clientDraft.notas]);
    return existing;
  }

  const client = {
    key: clientDraft.dedupeKey,
    nombre: clampText(clientDraft.nombre, MAX_CLIENT_NAME_LENGTH),
    email: clientDraft.email || null,
    telefono: clientDraft.telefono,
    estado: clientDraft.estado,
    notas: clientDraft.notas || null,
    source_sheet: clientDraft.source_sheet,
    source_row: clientDraft.source_row,
    legacy_excel: clientDraft.legacy_excel,
  };

  state.clients.set(clientDraft.dedupeKey, client);
  return client;
}

function ensureServiceDraft(state, slug, source) {
  const definition = SERVICE_DEFINITIONS[slug] || buildFallbackServiceDefinition(slug);
  const existing = state.services.get(slug);

  if (existing) {
    existing.observedRows.push(source);
    return existing;
  }

  const draft = {
    slug,
    nombre: definition.name,
    descripcion: definition.description,
    color: definition.color,
    activo: true,
    observedRows: [source],
    source_sheet: source.sheetName,
    source_row: source.rowIndex,
    legacy_excel: {
      origin: "excel-migration",
      service_slug: slug,
    },
    observedPrices: [],
  };

  state.services.set(slug, draft);
  return draft;
}

function ensurePlanDraft(state, planName, serviceSlug, source) {
  const normalized = clampText(normalizeCell(planName), MAX_PLAN_NAME_LENGTH);

  if (!normalized) {
    return null;
  }

  const key = `${serviceSlug}::${normalizeIdentifier(normalized)}`;
  const existing = state.plans.get(key);

  if (existing) {
    return existing;
  }

  const draft = {
    key,
    nombre: normalized,
    servicioSlug: serviceSlug,
    precio: 0,
    activo: true,
    descripcion: "Migrado desde Excel",
    source_sheet: source.sheetName,
    source_row: source.rowIndex,
    legacy_excel: {
      origin: "excel-migration",
      plan_name: normalized,
    },
  };

  state.plans.set(key, draft);
  return draft;
}

function finalizeServicesAndPlans(state) {
  for (const account of state.accounts.values()) {
    const service = state.services.get(account.serviceSlug);

    if (service) {
      const nonZeroPrices = account.profiles
        .map((profile) => Number(profile.precio_individual))
        .filter((value) => Number.isFinite(value) && value > 0);

      service.observedPrices.push(...nonZeroPrices);
    }

    account.precio = resolveAccountPrice(account.profiles);
    account.perfiles_pines = buildAccountPins(account.profiles);
    account.max_perfiles = Math.max(
      account.perfiles_pines.length || 0,
      account.profiles.length || 0,
      1,
    );
    account.perfiles_activos = account.profiles.length;
    account.estado = deriveAccountState(account.fechaVencimiento, 7);
  }

  for (const service of state.services.values()) {
    const observed = service.observedPrices.filter((value) => value > 0);
    service.precio_mensual = observed.length
      ? Number(
          (
            observed.reduce((total, value) => total + value, 0) / observed.length
          ).toFixed(2),
        )
      : 0;
  }
}

function buildAccountPins(profiles) {
  const slots = new Map();

  for (const profile of profiles) {
    const existing = slots.get(profile.slotNumber);

    if (!existing) {
      slots.set(profile.slotNumber, {
        numero: profile.slotNumber,
        nombre: buildBaseProfileName(profile.slotNumber),
        pin: profile.pin,
      });
      continue;
    }

    if (!existing.pin && profile.pin) {
      existing.pin = profile.pin;
    }
  }

  return [...slots.values()].sort((left, right) => left.numero - right.numero);
}

function extractPlanName(row, config) {
  const explicit = normalizeCell(getCell(row, config.planCol));

  if (explicit && /plan/i.test(explicit)) {
    return explicit;
  }

  const extras = collectExtraValues(row, config.extraStartCol);
  const inferred = extras.find((value) => /plan/i.test(value));
  return inferred || null;
}

function buildInventoryNotes(row, config) {
  const notes = [];

  if (config.clientCol) {
    const clientValue = normalizeCell(getCell(row, config.clientCol));
    if (clientValue) {
      notes.push(`Cliente/descripcion: ${clientValue}`);
    }
  }

  if (config.pinCol) {
    const pinValue = normalizeCell(getCell(row, config.pinCol));
    if (pinValue) {
      notes.push(`PIN/referencia: ${pinValue}`);
    }
  }

  if (config.activationCol) {
    const activation = parseExcelDate(getCell(row, config.activationCol));
    if (activation) {
      notes.push(`Activacion: ${activation}`);
    }
  }

  if (config.expirationCol) {
    const expiration = parseExcelDate(getCell(row, config.expirationCol));
    if (expiration) {
      notes.push(`Vence: ${expiration}`);
    }
  }

  if (config.phoneCol) {
    const phone = normalizeCell(getCell(row, config.phoneCol));
    if (phone) {
      notes.push(`Telefono/nota original: ${phone}`);
    }
  }

  if (config.priceCol) {
    const price = normalizeCell(getCell(row, config.priceCol));
    if (price) {
      notes.push(`Precio original: ${price}`);
    }
  }

  if (config.costCol) {
    const cost = normalizeCell(getCell(row, config.costCol));
    if (cost) {
      notes.push(`Costo original: ${cost}`);
    }
  }

  return compactNotes(notes);
}

function buildLooseRowNotes(row, config) {
  const extras = collectExtraValues(row, config.extraStartCol);
  return compactNotes(extras);
}

function collectExtraValues(row, extraStartCol) {
  if (!extraStartCol) {
    return [];
  }

  const values = [];
  for (let col = extraStartCol; col <= row.length; col += 1) {
    const cell = normalizeCell(getCell(row, col));
    if (cell) {
      values.push(cell);
    }
  }
  return values;
}

function resolveServiceFromRowText(text) {
  const normalized = normalizeForSearch(text);

  if (!normalized) {
    return null;
  }

  for (const [slug, definition] of Object.entries(SERVICE_DEFINITIONS)) {
    if (definition.aliases.some((alias) => normalized.includes(alias))) {
      return {
        slug,
        name: definition.name,
      };
    }
  }

  return null;
}

function buildFallbackServiceDefinition(slug) {
  const colorSeed = slug
    .split("")
    .reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0);
  const colors = ["#2563EB", "#059669", "#DC2626", "#7C3AED", "#EA580C"];

  return {
    name: slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    color: colors[colorSeed % colors.length],
    description: "Migrado desde Excel",
  };
}

function buildSummary(plan) {
  return {
    services: plan.services.size,
    plans: plan.plans.size,
    clients: plan.clients.size,
    accounts: plan.accounts.size,
    profiles: [...plan.accounts.values()].reduce(
      (total, account) => total + account.profiles.length,
      0,
    ),
    transactions: plan.transactions.length,
    inventory: plan.inventory.length,
    review: plan.review.length,
  };
}

function printSummary(summary, reportPath, mode, applyResult = null) {
  console.log("");
  console.log(`Modo: ${mode}`);
  console.log(`Servicios: ${summary.services}`);
  console.log(`Planes: ${summary.plans}`);
  console.log(`Clientes: ${summary.clients}`);
  console.log(`Cuentas: ${summary.accounts}`);
  console.log(`Perfiles: ${summary.profiles}`);
  console.log(`Transacciones: ${summary.transactions}`);
  console.log(`Inventario: ${summary.inventory}`);
  console.log(`Revision manual: ${summary.review}`);

  if (applyResult) {
    console.log("");
    console.log(`Aplicadas: ${applyResult.created.total}`);
    console.log(`  Servicios: ${applyResult.created.services}`);
    console.log(`  Planes: ${applyResult.created.plans}`);
    console.log(`  Clientes: ${applyResult.created.clients}`);
    console.log(`  Cuentas: ${applyResult.created.accounts}`);
    console.log(`  Perfiles: ${applyResult.created.profiles}`);
    console.log(`  Transacciones: ${applyResult.created.transactions}`);
    console.log(`  Inventario: ${applyResult.created.inventory}`);
  }

  console.log("");
  console.log(`Reporte: ${reportPath}`);
}

async function applyMigration(plan) {
  let app = null;

  try {
    app = await createStrapi({
      appDir: STRAPI_APP_DIR,
      distDir: STRAPI_APP_DIR,
    }).load();

    const serviceDocumentIds = new Map();
    const planDocumentIds = new Map();
    const clientDocumentIds = new Map();
    const accountDocumentIds = new Map();
    const created = {
      services: 0,
      plans: 0,
      clients: 0,
      accounts: 0,
      profiles: 0,
      transactions: 0,
      inventory: 0,
      total: 0,
    };

    const migrationUser = await ensureMigrationUser(app);

    for (const service of plan.services.values()) {
      const existing = await findDocumentByField(
        app,
        "api::servicio.servicio",
        "nombre",
        service.nombre,
      );
      const document =
        existing ||
        (await app.documents("api::servicio.servicio").create({
          data: {
            nombre: service.nombre,
            descripcion: service.descripcion,
            color: service.color,
            precio_mensual: service.precio_mensual,
            activo: service.activo,
            source_sheet: service.source_sheet,
            source_row: service.source_row,
            legacy_excel: service.legacy_excel,
          },
        }));

      serviceDocumentIds.set(service.slug, document.documentId);
      if (!existing) {
        created.services += 1;
      }
    }

    for (const draft of plan.plans.values()) {
      const existing = await findDocumentByFilters(app, "api::plan.plan", {
        nombre: {
          $eq: draft.nombre,
        },
        servicio: {
          documentId: {
            $eq: serviceDocumentIds.get(draft.servicioSlug),
          },
        },
      });
      const document =
        existing ||
        (await app.documents("api::plan.plan").create({
          data: {
            nombre: draft.nombre,
            precio: draft.precio,
            descripcion: draft.descripcion,
            activo: draft.activo,
            servicio: serviceDocumentIds.get(draft.servicioSlug) || null,
            source_sheet: draft.source_sheet,
            source_row: draft.source_row,
            legacy_excel: draft.legacy_excel,
          },
        }));

      planDocumentIds.set(draft.key, document.documentId);
      if (!existing) {
        created.plans += 1;
      }
    }

    for (const client of plan.clients.values()) {
      const existing = await findDocumentByField(
        app,
        "api::cliente.cliente",
        "telefono",
        client.telefono,
      );
      const document =
        existing ||
        (await app.documents("api::cliente.cliente").create({
          data: {
            nombre: client.nombre,
            email: client.email,
            telefono: client.telefono,
            estado: client.estado,
            notas: client.notas,
            source_sheet: client.source_sheet,
            source_row: client.source_row,
            legacy_excel: client.legacy_excel,
          },
        }));

      clientDocumentIds.set(client.key, document.documentId);
      if (!existing) {
        created.clients += 1;
      }
    }

    for (const account of plan.accounts.values()) {
      const existing = await findDocumentByFilters(app, "api::cuenta.cuenta", {
        email: {
          $eq: account.email,
        },
        servicio: {
          documentId: {
            $eq: serviceDocumentIds.get(account.serviceSlug),
          },
        },
      });
      const document =
        existing ||
        (await app.documents("api::cuenta.cuenta").create({
          data: {
            cliente: clientDocumentIds.get(account.primaryClientKey),
            servicio: serviceDocumentIds.get(account.serviceSlug),
            plan: account.plan,
            email: account.email,
            identificador_cuenta: account.identificador_cuenta,
            password: account.password,
            fechaInicio: account.fechaInicio,
            fechaVencimiento: account.fechaVencimiento,
            precio: account.precio,
            estado: account.estado,
            notas: account.notas,
            alerta_dias: 7,
            max_perfiles: account.max_perfiles,
            perfiles_activos: account.perfiles_activos,
            perfiles_pines: account.perfiles_pines,
            source_sheet: account.source_sheet,
            source_row: account.source_row,
            legacy_excel: account.legacy_excel,
          },
        }));

      accountDocumentIds.set(account.key, document.documentId);
      if (!existing) {
        created.accounts += 1;
      }
    }

    for (const account of plan.accounts.values()) {
      for (const profile of account.profiles) {
        const existing = await findDocumentByFilters(app, "api::perfil.perfil", {
          source_sheet: {
            $eq: profile.source_sheet,
          },
          source_row: {
            $eq: profile.source_row,
          },
          cuenta: {
            documentId: {
              $eq: accountDocumentIds.get(account.key),
            },
          },
        });

        if (existing) {
          continue;
        }

        await app.documents("api::perfil.perfil").create({
          data: {
            cuenta: accountDocumentIds.get(account.key),
            cliente: clientDocumentIds.get(profile.clientKey),
            codigo_pin: profile.pin,
            nombre_perfil: clampText(profile.nombre_perfil, MAX_PROFILE_NAME_LENGTH),
            tipo_dispositivo: profile.tipo_dispositivo,
            fecha_activacion: profile.fecha_activacion,
            fecha_vencimiento: profile.fecha_vencimiento,
            estado: deriveProfileState(profile.fecha_vencimiento),
            precio_individual: profile.precio_individual,
            notas: profile.notas,
            requiere_seguimiento: profile.requiere_seguimiento,
            requiere_cobro: profile.requiere_cobro,
            requiere_reenvio: profile.requiere_reenvio,
            renovado_en_excel: profile.renovado_en_excel,
            source_sheet: profile.source_sheet,
            source_row: profile.source_row,
            legacy_excel: profile.legacy_excel,
          },
        });
        created.profiles += 1;
      }
    }

    for (const transaction of plan.transactions) {
      const existing = await findDocumentByFilters(app, "api::transaccion.transaccion", {
        source_sheet: {
          $eq: transaction.source_sheet,
        },
        source_row: {
          $eq: transaction.source_row,
        },
        tipo: {
          $eq: transaction.tipo,
        },
      });

      if (existing) {
        continue;
      }

      await app.documents("api::transaccion.transaccion").create({
        data: {
          cliente: clientDocumentIds.get(transaction.clientKey),
          cuenta: accountDocumentIds.get(transaction.accountKey),
          colaborador: migrationUser.documentId,
          monto: transaction.monto,
          tipo: transaction.tipo,
          estado: transaction.estado,
          metodo_pago: clampText(transaction.metodo_pago, MAX_PAYMENT_METHOD_LENGTH),
          fecha: toDateTimeString(transaction.fecha),
          notas: transaction.notas,
          source_sheet: transaction.source_sheet,
          source_row: transaction.source_row,
          legacy_excel: transaction.legacy_excel,
        },
      });
      created.transactions += 1;
    }

    for (const entry of plan.inventory) {
      const existing = await findDocumentByFilters(
        app,
        "api::inventario-credencial.inventario-credencial",
        {
          identificador_acceso: {
            $eq: entry.identificador_acceso,
          },
          servicio_origen: {
            $eq: entry.servicio_origen,
          },
        },
      );

      if (existing) {
        continue;
      }

      await app.documents("api::inventario-credencial.inventario-credencial").create({
        data: {
          servicio: entry.servicioSlug
            ? serviceDocumentIds.get(entry.servicioSlug) || null
            : null,
          servicio_origen: entry.servicio_origen,
          identificador_acceso: entry.identificador_acceso,
          email: entry.email,
          password: entry.password,
          estado_vinculacion: entry.estado_vinculacion,
          categoria_origen: entry.categoria_origen,
          notas: entry.notas,
          source_sheet: entry.source_sheet,
          source_row: entry.source_row,
          legacy_excel: entry.legacy_excel,
        },
      });
      created.inventory += 1;
    }

    created.total =
      created.services +
      created.plans +
      created.clients +
      created.accounts +
      created.profiles +
      created.transactions +
      created.inventory;

    return {
      created,
      migrationUser: migrationUser.documentId,
    };
  } finally {
    if (app) {
      await app.destroy();
    }
  }
}

async function ensureMigrationUser(app) {
  const existing = await findDocumentByField(
    app,
    "api::usuario.usuario",
    "nombre",
    MIGRATION_USER_NAME,
  );

  if (existing) {
    return existing;
  }

  return app.documents("api::usuario.usuario").create({
    data: {
      nombre: MIGRATION_USER_NAME,
      rol: "administrador",
      activo: true,
      telefono: "migration-system",
    },
  });
}

async function findDocumentByField(app, uid, field, value) {
  return findDocumentByFilters(app, uid, {
    [field]: {
      $eq: value,
    },
  });
}

async function findDocumentByFilters(app, uid, filters) {
  const documents = await app.documents(uid).findMany({
    filters,
    limit: 1,
  });

  return documents[0] || null;
}

function deriveAccountState(fechaVencimiento, alertaDias) {
  const today = getDateString(new Date());

  if (!fechaVencimiento) {
    return "inactiva";
  }

  if (fechaVencimiento < today) {
    return "vencida";
  }

  const diff = diffInDays(today, fechaVencimiento);
  return diff <= alertaDias ? "por_vencer" : "activa";
}

function deriveProfileState(fechaVencimiento) {
  const today = getDateString(new Date());

  if (!fechaVencimiento) {
    return "suspendido";
  }

  if (fechaVencimiento < today) {
    return "vencido";
  }

  return diffInDays(today, fechaVencimiento) <= 7 ? "por_vencer" : "activo";
}

function extractSheetToday(rows) {
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 3); rowIndex += 1) {
    const row = rows[rowIndex] || [];

    for (const cell of row) {
      const parsed = parseExcelDate(cell);
      if (parsed) {
        return new Date(`${parsed}T00:00:00`);
      }
    }
  }

  return new Date();
}

function parseExcelDate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return getDateString(value);
  }

  const stringValue = String(value).trim();
  if (!stringValue || /#REF!/i.test(stringValue)) {
    return null;
  }

  if (/^\d+(\.\d+)?$/.test(stringValue)) {
    const serial = Number.parseFloat(stringValue);
    const parsed = XLSX.SSF.parse_date_code(serial);

    if (!parsed) {
      return null;
    }

    return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  const parsedDate = new Date(stringValue);
  if (!Number.isNaN(parsedDate.getTime())) {
    return getDateString(parsedDate);
  }

  return null;
}

function parseMoney(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return Number(value.toFixed(2));
  }

  const stringValue = String(value).trim();
  if (!stringValue || stringValue === "$" || /#REF!/i.test(stringValue)) {
    return null;
  }

  const match = stringValue.replace(/\s+/g, "").match(/-?\d+(?:[.,]\d+)?/);
  if (!match) {
    return null;
  }

  const normalized = match[0].replace(",", ".");
  const numericValue = Number.parseFloat(normalized);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return Number(numericValue.toFixed(2));
}

function parseInteger(value) {
  const money = parseMoney(value);
  if (money === null) {
    return null;
  }
  return Math.trunc(money);
}

function normalizePhone(value) {
  const text = normalizeCell(value);

  if (!text) {
    return null;
  }

  const digits = text.replace(/[^\d+]/g, "");
  const plainDigits = digits.replace(/\+/g, "");

  if (plainDigits.length < 7) {
    return null;
  }

  const normalized = digits.startsWith("+") ? `+${plainDigits}` : plainDigits;
  return normalized.length <= MAX_CLIENT_PHONE_LENGTH ? normalized : null;
}

function inferDeviceType(rawDevice, notes) {
  const haystack = normalizeForSearch(`${normalizeCell(rawDevice) || ""} ${notes || ""}`);

  if (/(tablet|ipad)/.test(haystack)) {
    return "Tablet";
  }

  if (/(pc|computador|laptop)/.test(haystack)) {
    return "PC";
  }

  if (/(cel|movil|android|iphone)/.test(haystack)) {
    return "Cel";
  }

  return "TV";
}

function buildProfileName(slotNumber, clientName) {
  const base = buildBaseProfileName(slotNumber);
  return clampText(clientName ? `${base} - ${clientName}` : base, MAX_PROFILE_NAME_LENGTH);
}

function buildBaseProfileName(slotNumber) {
  return `Perfil ${slotNumber}`;
}

function buildGeneratedPin(sheetName, rowIndex, slotNumber) {
  const seed = `${slugify(sheetName)}${String(rowIndex).padStart(3, "0")}${String(
    slotNumber,
  ).padStart(2, "0")}`;

  return seed.slice(-4).padStart(4, "0");
}

function buildSyntheticEmail(identifier, serviceSlug, rowIndex) {
  const prefix = slugify(identifier).slice(0, 30) || `${serviceSlug}-${rowIndex}`;
  return `${prefix}-${serviceSlug}-${rowIndex}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

function buildSyntheticClientPhone(sheetName, rowIndex) {
  const sheetToken = slugify(sheetName).slice(0, 10) || "sheet";
  return `mig-${sheetToken}-${String(rowIndex).padStart(4, "0")}`.slice(
    0,
    MAX_CLIENT_PHONE_LENGTH,
  );
}

function clampText(value, maxLength) {
  const text = normalizeCell(value);

  if (!text) {
    return null;
  }

  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function buildLegacyExcel(sheetName, rowIndex, row, extra = {}) {
  return {
    source_sheet: sheetName,
    source_row: rowIndex,
    row_snapshot: sanitizeRow(row),
    ...extra,
  };
}

function sanitizeRow(row) {
  return (row || []).map((value) => {
    if (value === undefined) {
      return null;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed || null;
    }
    return value;
  });
}

function getCell(row, column) {
  if (!row || !column) {
    return null;
  }

  return row[column - 1] ?? null;
}

function firstMeaningfulValue(rows, column) {
  for (const rowItem of rows) {
    const value = normalizeCell(getCell(rowItem.values, column));
    if (value) {
      return value;
    }
  }
  return null;
}

function isRowEmpty(row) {
  return !(row || []).some((value) => normalizeCell(value));
}

function normalizeCell(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  return text || null;
}

function normalizeIdentifier(value) {
  return normalizeForSearch(value).replace(/[^a-z0-9]+/g, "-");
}

function normalizeForSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function slugify(value) {
  return normalizeIdentifier(value).replace(/^-+|-+$/g, "");
}

function flattenRowText(rows) {
  return rows
    .flat()
    .map((value) => normalizeCell(value))
    .filter(Boolean)
    .join(" ");
}

function compactNotes(notes) {
  const values = (notes || [])
    .flat()
    .map((value) => normalizeCell(value))
    .filter(Boolean);

  if (values.length === 0) {
    return null;
  }

  return [...new Set(values)].join(" | ");
}

function pickBestPlanName(planNames) {
  const values = [...planNames].filter(Boolean);
  return values.length > 0 ? values[0] : null;
}

function pickLongerText(left, right) {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return right.length > left.length ? right : left;
}

function isLikelyEmail(value) {
  const text = normalizeCell(value);
  return Boolean(text && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text));
}

function isTruthyFlag(value) {
  const text = normalizeCell(value);

  if (!text) {
    return false;
  }

  if (/^(no|false)$/i.test(text)) {
    return false;
  }

  return true;
}

function looksLikeNumeric(value) {
  return /^-?\d+([.,]\d+)?$/.test(String(value || "").trim());
}

function getDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function addDaysToDateString(dateString, days) {
  if (!dateString) {
    return null;
  }

  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return getDateString(date);
}

function diffInDays(fromDateString, toDateString) {
  const fromDate = new Date(`${fromDateString}T00:00:00`);
  const toDate = new Date(`${toDateString}T00:00:00`);

  return Math.round((toDate.getTime() - fromDate.getTime()) / 86400000);
}

function toDateTimeString(dateString) {
  if (!dateString) {
    return new Date().toISOString();
  }

  return dateString.includes("T")
    ? dateString
    : `${dateString}T00:00:00.000Z`;
}

main().catch((error) => {
  console.error("");
  console.error("Error ejecutando la migracion de Excel:");
  console.error(error.stack || error.message || error);
  process.exit(1);
});
