"use strict";

const { factories } = require("@strapi/strapi");
const createWhatsappProvider = require("../../../services/whatsapp-provider");

const CONFIG_UID = "api::automatizacion-whatsapp.automatizacion-whatsapp";
const CAMPAIGN_UID = "api::campana-whatsapp.campana-whatsapp";
const MESSAGE_UID = "api::mensaje-whatsapp.mensaje-whatsapp";
const PROFILE_UID = "api::perfil.perfil";

const DEFAULT_CONFIG = {
  activo: false,
  timezone: "America/Bogota",
  hora_inicio_diaria: "09:00",
  intervalo_minutos: 2,
  maximo_envios_por_dia: 200,
  modo_prueba: true,
  pausado: false,
  template_meta_cobro_hoy: "",
};

const SUCCESS_STATUSES = new Set(["sent", "delivered", "read"]);
const TERMINAL_STATUSES = new Set([
  "sent",
  "delivered",
  "read",
  "failed",
  "skipped",
  "canceled",
]);
const EXCLUDED_FROM_AUTOMATION = new Set([
  "sent",
  "delivered",
  "read",
  "skipped",
  "canceled",
]);

const pad = (value) => String(value).padStart(2, "0");

const getTimeZoneParts = (
  date = new Date(),
  timeZone = DEFAULT_CONFIG.timezone,
) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
};

const getDateStringInTimeZone = (
  date = new Date(),
  timeZone = DEFAULT_CONFIG.timezone,
) => {
  const parts = getTimeZoneParts(date, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
};

const getMinutesOfDayInTimeZone = (
  date = new Date(),
  timeZone = DEFAULT_CONFIG.timezone,
) => {
  const parts = getTimeZoneParts(date, timeZone);
  return parts.hour * 60 + parts.minute;
};

const parseTimeStringToMinutes = (
  value = DEFAULT_CONFIG.hora_inicio_diaria,
) => {
  const [hour = "0", minute = "0"] = String(value).split(":");
  return Number(hour) * 60 + Number(minute);
};

const addMinutes = (date, minutes) =>
  new Date(date.getTime() + Number(minutes || 0) * 60000);

const cleanPhone = (value = "") => String(value).replace(/\D/g, "");

const getGreetingByHour = (
  date = new Date(),
  timeZone = DEFAULT_CONFIG.timezone,
) => {
  const { hour } = getTimeZoneParts(date, timeZone);

  if (hour < 12) {
    return "Hola buenos días";
  }

  if (hour < 18) {
    return "Hola buenas tardes";
  }

  return "Hola buenas noches";
};

const buildDedupeKey = ({ tipoAccion, perfilDocumentId, fechaOperativa }) =>
  `${tipoAccion}:${perfilDocumentId}:${fechaOperativa}`;

const sortMessagesDesc = (messages = []) =>
  [...messages].sort((left, right) => {
    const leftDate =
      left.readAt ||
      left.deliveredAt ||
      left.sentAt ||
      left.scheduledFor ||
      left.updatedAt ||
      left.createdAt ||
      "";
    const rightDate =
      right.readAt ||
      right.deliveredAt ||
      right.sentAt ||
      right.scheduledFor ||
      right.updatedAt ||
      right.createdAt ||
      "";

    return String(rightDate).localeCompare(String(leftDate));
  });

module.exports = factories.createCoreService(CONFIG_UID, ({ strapi }) => ({
  async getConfig() {
    const existing = await strapi.db.query(CONFIG_UID).findOne();

    if (existing) {
      return {
        ...DEFAULT_CONFIG,
        ...existing,
      };
    }

    return strapi.db.query(CONFIG_UID).create({
      data: DEFAULT_CONFIG,
    });
  },

  async updateConfig(data = {}) {
    const existing = await this.getConfig();
    const payload = {
      ...DEFAULT_CONFIG,
      ...existing,
      ...Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
      ),
    };

    if (existing.id) {
      await strapi.db.query(CONFIG_UID).update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await strapi.db.query(CONFIG_UID).create({ data: payload });
    }

    return this.getConfig();
  },

  async listCampaigns({ fecha } = {}) {
    const config = await this.getConfig();
    const dateFilter =
      fecha || getDateStringInTimeZone(new Date(), config.timezone);
    const campaigns = await strapi.documents(CAMPAIGN_UID).findMany({
      filters: {
        fecha_operativa: {
          $eq: dateFilter,
        },
      },
      sort: ["createdAt:desc"],
      populate: {
        mensajes: {
          fields: [
            "documentId",
            "status",
            "source",
            "scheduledFor",
            "sentAt",
            "deliveredAt",
            "readAt",
            "telefono_snapshot",
            "attemptCount",
            "lastError",
            "payload_snapshot",
            "fecha_operativa",
            "tipo_accion",
          ],
          populate: {
            cliente: {
              fields: ["documentId", "nombre", "telefono"],
            },
            perfil: {
              fields: ["documentId", "nombre_perfil", "fecha_vencimiento"],
            },
            cuenta: {
              fields: ["documentId", "email", "identificador_cuenta"],
            },
            servicio: {
              fields: ["documentId", "nombre"],
            },
          },
        },
      },
      limit: 10,
    });

    return {
      fecha: dateFilter,
      items: campaigns.map((campaign) => ({
        ...campaign,
        mensajes: sortMessagesDesc(campaign.mensajes || []),
      })),
    };
  },

  async findCampaignByOperationalDate(fechaOperativa, tipo = "cobro_hoy") {
    const campaigns = await strapi.documents(CAMPAIGN_UID).findMany({
      filters: {
        fecha_operativa: {
          $eq: fechaOperativa,
        },
        tipo: {
          $eq: tipo,
        },
      },
      sort: ["createdAt:desc"],
      limit: 1,
      populate: {
        mensajes: {
          fields: ["documentId", "status"],
        },
      },
    });

    return campaigns[0] || null;
  },

  async getTodayCampaignSummary() {
    const config = await this.getConfig();
    const today = getDateStringInTimeZone(new Date(), config.timezone);
    return this.findCampaignByOperationalDate(today, "cobro_hoy");
  },

  async generateTodayCampaign({ force = false } = {}) {
    const config = await this.getConfig();
    const now = new Date();
    const fechaOperativa = getDateStringInTimeZone(now, config.timezone);
    const existing = await this.findCampaignByOperationalDate(
      fechaOperativa,
      "cobro_hoy",
    );

    if (existing && !force) {
      return {
        created: false,
        campaign: existing,
      };
    }

    if (existing && force && existing.estado === "cancelada") {
      await strapi.documents(CAMPAIGN_UID).update({
        documentId: existing.documentId,
        data: {
          estado: "programada",
          completedAt: null,
          startedAt: null,
        },
      });
    }

    const eligibleProfiles = await this.findEligibleProfilesForCobroHoy({
      fechaOperativa,
      maximoEnviosPorDia: config.maximo_envios_por_dia,
    });
    const campaign =
      existing ||
      (await strapi.documents(CAMPAIGN_UID).create({
        data: {
          tipo: "cobro_hoy",
          fecha_operativa: fechaOperativa,
          estado: eligibleProfiles.length ? "programada" : "completada",
          scheduledStartAt: new Date().toISOString(),
          completedAt: eligibleProfiles.length
            ? null
            : new Date().toISOString(),
          totalObjetivos: eligibleProfiles.length,
          totalPendientes: eligibleProfiles.length,
          totalEnviados: 0,
          totalFallidos: 0,
          totalOmitidos: 0,
          automation_snapshot: {
            timezone: config.timezone,
            hora_inicio_diaria: config.hora_inicio_diaria,
            intervalo_minutos: config.intervalo_minutos,
            modo_prueba: config.modo_prueba,
            template_meta_cobro_hoy: config.template_meta_cobro_hoy,
          },
        },
      }));

    await this.enqueueCampaignMessages(
      campaign,
      eligibleProfiles,
      config,
      fechaOperativa,
    );
    const synced = await this.syncCampaignStats(campaign.documentId);

    return {
      created: !existing,
      campaign: synced,
    };
  },

  async pauseCampaign(documentId) {
    await strapi.documents(CAMPAIGN_UID).update({
      documentId,
      data: {
        estado: "pausada",
      },
    });

    return this.syncCampaignStats(documentId);
  },

  async resumeCampaign(documentId) {
    const campaign = await strapi.documents(CAMPAIGN_UID).findOne({
      documentId,
      populate: {
        mensajes: {
          fields: ["documentId", "status"],
        },
      },
    });

    if (!campaign) {
      throw new Error("Campaña no encontrada");
    }

    await strapi.documents(CAMPAIGN_UID).update({
      documentId,
      data: {
        estado: campaign.mensajes?.some(
          (message) => !TERMINAL_STATUSES.has(message.status),
        )
          ? "ejecutando"
          : "completada",
      },
    });

    return this.syncCampaignStats(documentId);
  },

  async cancelCampaign(documentId) {
    const campaign = await strapi.documents(CAMPAIGN_UID).findOne({
      documentId,
      populate: {
        mensajes: {
          fields: ["documentId", "status"],
        },
      },
    });

    if (!campaign) {
      throw new Error("Campaña no encontrada");
    }

    await Promise.all(
      (campaign.mensajes || [])
        .filter((message) => !TERMINAL_STATUSES.has(message.status))
        .map((message) =>
          strapi.documents(MESSAGE_UID).update({
            documentId: message.documentId,
            data: {
              status: "canceled",
              lastError: "Cancelado manualmente",
            },
          }),
        ),
    );

    await strapi.documents(CAMPAIGN_UID).update({
      documentId,
      data: {
        estado: "cancelada",
        completedAt: new Date().toISOString(),
      },
    });

    return this.syncCampaignStats(documentId);
  },

  async registerManualContact(payload = {}) {
    const {
      perfilId,
      status = "sent",
      notes = "",
      campaignId,
    } = payload;

    if (!perfilId) {
      throw new Error("perfilId es requerido");
    }

    if (!["sent", "skipped"].includes(status)) {
      throw new Error("status manual inválido");
    }

    const config = await this.getConfig();
    const fechaOperativa = getDateStringInTimeZone(new Date(), config.timezone);
    const profile = await this.getProfileForMessage(perfilId);

    if (!profile) {
      throw new Error("Perfil no encontrado");
    }

    const dedupeKey = buildDedupeKey({
      tipoAccion: "cobro_hoy",
      perfilDocumentId: profile.documentId,
      fechaOperativa,
    });
    const existing = await this.findMessageByDedupeKey(dedupeKey);
    const associatedCampaign = campaignId
      ? await strapi.documents(CAMPAIGN_UID).findOne({ documentId: campaignId })
      : await this.findCampaignByOperationalDate(fechaOperativa);
    const data = {
      campana: associatedCampaign?.documentId || null,
      cliente: profile.cliente?.documentId || null,
      perfil: profile.documentId,
      cuenta: profile.cuenta?.documentId || null,
      servicio: profile.cuenta?.servicio?.documentId || null,
      tipo_accion: "cobro_hoy",
      source: "manual",
      fecha_operativa: fechaOperativa,
      telefono_snapshot: cleanPhone(profile.cliente?.telefono || ""),
      payload_snapshot: {
        nombre: profile.cliente?.nombre || "",
        servicio: profile.cuenta?.servicio?.nombre || "",
        notes,
      },
      scheduledFor: existing?.scheduledFor || new Date().toISOString(),
      sentAt: status === "sent" ? new Date().toISOString() : null,
      status,
      provider: "meta",
      lastError: status === "skipped" ? notes || "Omitido manualmente" : notes || "",
      dedupeKey,
    };

    const saved = existing
      ? await strapi.documents(MESSAGE_UID).update({
          documentId: existing.documentId,
          data,
        })
      : await strapi.documents(MESSAGE_UID).create({
          data,
        });

    if (associatedCampaign?.documentId) {
      await this.syncCampaignStats(associatedCampaign.documentId);
    }

    return saved;
  },

  async handleWebhookPayload(payload = {}) {
    const statuses =
      payload.entry?.flatMap((entry) =>
        entry.changes?.flatMap((change) => change.value?.statuses || []),
      ) || [];

    for (const statusPayload of statuses) {
      const providerMessageId = statusPayload.id;

      if (!providerMessageId) {
        continue;
      }

      const matches = await strapi.documents(MESSAGE_UID).findMany({
        filters: {
          providerMessageId: {
            $eq: providerMessageId,
          },
        },
        limit: 1,
        populate: {
          campana: {
            fields: ["documentId"],
          },
        },
      });
      const message = matches[0];

      if (!message) {
        continue;
      }

      const statusMap = {
        sent: "sent",
        delivered: "delivered",
        read: "read",
        failed: "failed",
      };
      const nextStatus = statusMap[statusPayload.status];

      if (!nextStatus) {
        continue;
      }

      await strapi.documents(MESSAGE_UID).update({
        documentId: message.documentId,
        data: {
          status: nextStatus,
          sentAt:
            nextStatus === "sent" && !message.sentAt
              ? new Date().toISOString()
              : message.sentAt,
          deliveredAt:
            nextStatus === "delivered"
              ? new Date().toISOString()
              : message.deliveredAt,
          readAt:
            nextStatus === "read" ? new Date().toISOString() : message.readAt,
          lastError:
            nextStatus === "failed"
              ? statusPayload.errors?.[0]?.title || "Meta reportó fallo"
              : message.lastError,
        },
      });

      if (message.campana?.documentId) {
        await this.syncCampaignStats(message.campana.documentId);
      }
    }

    return true;
  },

  async runAutomationTick() {
    const config = await this.getConfig();

    if (!config.activo || config.pausado) {
      return { skipped: true, reason: "inactive_or_paused" };
    }

    const currentMinutes = getMinutesOfDayInTimeZone(
      new Date(),
      config.timezone,
    );
    const configuredMinutes = parseTimeStringToMinutes(
      config.hora_inicio_diaria,
    );

    if (currentMinutes >= configuredMinutes) {
      await this.generateTodayCampaign();
    }

    await this.dispatchPendingMessages(config);

    return { skipped: false };
  },

  async dispatchPendingMessages(config) {
    const today = getDateStringInTimeZone(new Date(), config.timezone);
    const pendingMessages = await strapi.documents(MESSAGE_UID).findMany({
      filters: {
        fecha_operativa: {
          $eq: today,
        },
        tipo_accion: {
          $eq: "cobro_hoy",
        },
        status: {
          $eq: "pending",
        },
        scheduledFor: {
          $lte: new Date().toISOString(),
        },
      },
      sort: ["scheduledFor:asc"],
      limit: 10,
      populate: {
        campana: {
          fields: ["documentId", "estado"],
        },
      },
    });

    for (const message of pendingMessages) {
      if (
        message.campana?.estado === "pausada" ||
        message.campana?.estado === "cancelada"
      ) {
        continue;
      }

      await this.sendMessage(message.documentId, config);
    }
  },

  async sendMessage(messageDocumentId, config) {
    const whatsappProvider = createWhatsappProvider({ strapi });
    const message = await strapi.documents(MESSAGE_UID).findOne({
      documentId: messageDocumentId,
      populate: {
        campana: {
          fields: ["documentId", "estado", "startedAt"],
        },
        cliente: {
          fields: ["documentId", "nombre", "telefono"],
        },
        perfil: {
          fields: ["documentId", "nombre_perfil"],
        },
        cuenta: {
          fields: ["documentId", "email", "identificador_cuenta"],
          populate: {
            servicio: {
              fields: ["documentId", "nombre"],
            },
          },
        },
      },
    });

    if (!message || message.status !== "pending") {
      return null;
    }

    if (
      message.campana?.estado === "pausada" ||
      message.campana?.estado === "cancelada"
    ) {
      return null;
    }

    await strapi.documents(MESSAGE_UID).update({
      documentId: message.documentId,
      data: {
        status: "sending",
        attemptCount: Number(message.attemptCount || 0) + 1,
      },
    });

    try {
      const result = await whatsappProvider.sendTemplate({
        phone: message.telefono_snapshot,
        templateName: config.template_meta_cobro_hoy,
        bodyParameters: [
          message.cliente?.nombre || "",
          getGreetingByHour(new Date(), config.timezone),
          message.cuenta?.servicio?.nombre || "",
        ],
        modoPrueba: Boolean(config.modo_prueba),
        metadata: {
          tipoAccion: message.tipo_accion,
          perfilId: message.perfil?.documentId || null,
          campaignId: message.campana?.documentId || null,
        },
      });

      const updated = await strapi.documents(MESSAGE_UID).update({
        documentId: message.documentId,
        data: {
          status: "sent",
          sentAt: new Date().toISOString(),
          providerMessageId: result.providerMessageId,
          lastError: "",
        },
      });

      if (message.campana?.documentId) {
        await strapi.documents(CAMPAIGN_UID).update({
          documentId: message.campana.documentId,
          data: {
            estado: "ejecutando",
            startedAt:
              message.campana.startedAt || new Date().toISOString(),
          },
        });
        await this.syncCampaignStats(message.campana.documentId);
      }

      return updated;
    } catch (error) {
      const updated = await strapi.documents(MESSAGE_UID).update({
        documentId: message.documentId,
        data: {
          status: "failed",
          lastError: error.message,
        },
      });

      if (message.campana?.documentId) {
        await this.syncCampaignStats(message.campana.documentId);
      }

      return updated;
    }
  },

  async syncCampaignStats(campaignDocumentId) {
    const campaign = await strapi.documents(CAMPAIGN_UID).findOne({
      documentId: campaignDocumentId,
      populate: {
        mensajes: {
          fields: ["documentId", "status", "sentAt", "scheduledFor"],
        },
      },
    });

    if (!campaign) {
      throw new Error("Campaña no encontrada");
    }

    const messages = campaign.mensajes || [];
    const totalObjetivos = messages.length;
    const totalPendientes = messages.filter((message) =>
      ["pending", "sending"].includes(message.status),
    ).length;
    const totalEnviados = messages.filter((message) =>
      SUCCESS_STATUSES.has(message.status),
    ).length;
    const totalFallidos = messages.filter(
      (message) => message.status === "failed",
    ).length;
    const totalOmitidos = messages.filter((message) =>
      ["skipped", "canceled"].includes(message.status),
    ).length;

    let estado = campaign.estado;
    let completedAt = campaign.completedAt || null;

    if (
      estado !== "pausada" &&
      estado !== "cancelada" &&
      estado !== "fallida"
    ) {
      if (totalObjetivos === 0 || totalPendientes === 0) {
        estado = "completada";
        completedAt = completedAt || new Date().toISOString();
      } else if (messages.some((message) => message.sentAt)) {
        estado = "ejecutando";
      } else {
        estado = "programada";
      }
    }

    await strapi.documents(CAMPAIGN_UID).update({
      documentId: campaignDocumentId,
      data: {
        estado,
        completedAt,
        totalObjetivos,
        totalPendientes,
        totalEnviados,
        totalFallidos,
        totalOmitidos,
      },
    });

    return strapi.documents(CAMPAIGN_UID).findOne({
      documentId: campaignDocumentId,
      populate: {
        mensajes: {
          fields: [
            "documentId",
            "status",
            "source",
            "scheduledFor",
            "sentAt",
            "deliveredAt",
            "readAt",
            "telefono_snapshot",
            "attemptCount",
            "lastError",
            "payload_snapshot",
            "fecha_operativa",
          ],
          populate: {
            cliente: {
              fields: ["documentId", "nombre", "telefono"],
            },
            perfil: {
              fields: ["documentId", "nombre_perfil", "fecha_vencimiento"],
            },
            cuenta: {
              fields: ["documentId", "email", "identificador_cuenta"],
            },
            servicio: {
              fields: ["documentId", "nombre"],
            },
          },
        },
      },
    });
  },

  async findEligibleProfilesForCobroHoy({
    fechaOperativa,
    maximoEnviosPorDia,
  }) {
    const existingMessages = await strapi.documents(MESSAGE_UID).findMany({
      filters: {
        fecha_operativa: {
          $eq: fechaOperativa,
        },
        tipo_accion: {
          $eq: "cobro_hoy",
        },
      },
      fields: ["documentId", "status", "dedupeKey"],
      populate: {
        perfil: {
          fields: ["documentId"],
        },
      },
      limit: 1000,
    });
    const excludedProfileIds = new Set(
      existingMessages
        .filter((message) => EXCLUDED_FROM_AUTOMATION.has(message.status))
        .map((message) => message.perfil?.documentId)
        .filter(Boolean),
    );
    const profiles = await strapi.documents(PROFILE_UID).findMany({
      filters: {
        fecha_vencimiento: {
          $eq: fechaOperativa,
        },
      },
      populate: {
        cliente: {
          fields: ["documentId", "nombre", "telefono"],
        },
        cuenta: {
          fields: ["documentId", "email", "identificador_cuenta", "password"],
          populate: {
            servicio: {
              fields: ["documentId", "nombre"],
            },
          },
        },
      },
      sort: ["createdAt:asc"],
      limit: Math.max(
        Number(maximoEnviosPorDia || DEFAULT_CONFIG.maximo_envios_por_dia),
        1,
      ),
    });

    return profiles.filter((profile) => {
      if (!profile.documentId || excludedProfileIds.has(profile.documentId)) {
        return false;
      }

      return Boolean(
        cleanPhone(profile.cliente?.telefono || "") &&
          profile.cliente?.documentId &&
          profile.cuenta?.documentId &&
          profile.cuenta?.servicio?.documentId,
      );
    });
  },

  async enqueueCampaignMessages(campaign, profiles, config, fechaOperativa) {
    const baseDate = new Date();

    for (const [index, profile] of profiles.entries()) {
      const dedupeKey = buildDedupeKey({
        tipoAccion: "cobro_hoy",
        perfilDocumentId: profile.documentId,
        fechaOperativa,
      });
      const existing = await this.findMessageByDedupeKey(dedupeKey);

      if (existing) {
        continue;
      }

      await strapi.documents(MESSAGE_UID).create({
        data: {
          campana: campaign.documentId,
          cliente: profile.cliente.documentId,
          perfil: profile.documentId,
          cuenta: profile.cuenta.documentId,
          servicio: profile.cuenta.servicio.documentId,
          tipo_accion: "cobro_hoy",
          source: "automatico",
          fecha_operativa: fechaOperativa,
          telefono_snapshot: cleanPhone(profile.cliente.telefono || ""),
          payload_snapshot: {
            nombre: profile.cliente.nombre,
            saludo: getGreetingByHour(baseDate, config.timezone),
            servicio: profile.cuenta.servicio.nombre,
            nombrePerfil: profile.nombre_perfil,
            accessValue:
              profile.cuenta.email ||
              profile.cuenta.identificador_cuenta ||
              "",
          },
          scheduledFor: addMinutes(
            baseDate,
            index * Number(config.intervalo_minutos || 2),
          ).toISOString(),
          status: "pending",
          provider: "meta",
          dedupeKey,
        },
      });
    }
  },

  async findMessageByDedupeKey(dedupeKey) {
    const matches = await strapi.documents(MESSAGE_UID).findMany({
      filters: {
        dedupeKey: {
          $eq: dedupeKey,
        },
      },
      limit: 1,
      populate: {
        campana: {
          fields: ["documentId"],
        },
      },
    });

    return matches[0] || null;
  },

  async getProfileForMessage(perfilDocumentId) {
    return strapi.documents(PROFILE_UID).findOne({
      documentId: perfilDocumentId,
      populate: {
        cliente: {
          fields: ["documentId", "nombre", "telefono"],
        },
        cuenta: {
          fields: ["documentId", "email", "identificador_cuenta", "password"],
          populate: {
            servicio: {
              fields: ["documentId", "nombre"],
            },
          },
        },
      },
    });
  },

  async getLatestStatusesByProfileIds(profileIds = [], fechaOperativa) {
    if (!profileIds.length) {
      return new Map();
    }

    const messages = await strapi.documents(MESSAGE_UID).findMany({
      filters: {
        fecha_operativa: {
          $eq: fechaOperativa,
        },
        tipo_accion: {
          $eq: "cobro_hoy",
        },
      },
      fields: [
        "documentId",
        "status",
        "source",
        "sentAt",
        "scheduledFor",
        "createdAt",
      ],
      populate: {
        campana: {
          fields: ["documentId"],
        },
        perfil: {
          fields: ["documentId"],
        },
      },
      limit: 1000,
    });
    const messagesByProfile = new Map();

    for (const message of messages) {
      const profileId = message.perfil?.documentId;

      if (!profileId || !profileIds.includes(profileId)) {
        continue;
      }

      const previous = messagesByProfile.get(profileId) || [];
      previous.push(message);
      messagesByProfile.set(profileId, previous);
    }

    const normalized = new Map();

    for (const profileId of profileIds) {
      const sorted = sortMessagesDesc(messagesByProfile.get(profileId) || []);
      const latest = sorted[0];

      normalized.set(
        profileId,
        latest
          ? {
              documentId: latest.documentId,
              status: latest.status,
              source: latest.source,
              sentAt: latest.sentAt || null,
              scheduledFor: latest.scheduledFor || null,
              campaignId: latest.campana?.documentId || null,
            }
          : null,
      );
    }

    return normalized;
  },
}));
