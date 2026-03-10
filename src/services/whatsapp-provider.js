"use strict";

const normalizePhone = (phone = "") => phone.replace(/\D/g, "");

const buildTemplateComponents = (bodyParameters = []) => {
  if (!bodyParameters.length) {
    return undefined;
  }

  return [
    {
      type: "body",
      parameters: bodyParameters.map((text) => ({
        type: "text",
        text: String(text ?? ""),
      })),
    },
  ];
};

module.exports = ({ strapi }) => ({
  async sendTemplate({
    phone,
    templateName,
    languageCode = "es_CO",
    bodyParameters = [],
    metadata = {},
    modoPrueba = false,
  }) {
    const cleanPhone = normalizePhone(phone);

    if (!cleanPhone) {
      throw new Error("Número de teléfono inválido");
    }

    if (!templateName && !modoPrueba) {
      throw new Error("No hay template de Meta configurado para cobro_hoy");
    }

    if (modoPrueba) {
      return {
        provider: "meta",
        providerMessageId: `test-${Date.now()}`,
        simulated: true,
        metadata,
      };
    }

    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = process.env.META_WHATSAPP_API_VERSION || "v22.0";

    if (!token || !phoneNumberId) {
      throw new Error(
        "Faltan META_WHATSAPP_TOKEN o META_WHATSAPP_PHONE_NUMBER_ID en el entorno",
      );
    }

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    const body = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
      },
    };
    const components = buildTemplateComponents(bodyParameters);

    if (components) {
      body.template.components = components;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    let parsed;

    try {
      parsed = responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      parsed = { raw: responseText };
    }

    if (!response.ok) {
      strapi.log.error("Meta WhatsApp API error", parsed);
      throw new Error(parsed?.error?.message || "Error enviando a Meta Cloud API");
    }

    return {
      provider: "meta",
      providerMessageId: parsed?.messages?.[0]?.id || "",
      response: parsed,
      metadata,
    };
  },
});
