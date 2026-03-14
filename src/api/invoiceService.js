import api from "./axios";

export async function getInvoices() {
  const response = await api.get("invoices/");
  return response.data;
}

export async function getInvoiceById(id) {
  const response = await api.get(`invoices/${id}/`);
  return response.data;
}

export async function createInvoice(data) {
  const response = await api.post("invoices/", data);
  return response.data;
}

export async function deleteInvoice(id) {
  const response = await api.delete(`invoices/${id}/`);
  return response.data;
}

export async function getInvoiceItems(invoiceId) {
  const response = await api.get("invoice-items/");
  const list = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.results)
      ? response.data.results
      : [];
  return list.filter((item) => Number(item?.invoice) === Number(invoiceId));
}

export async function createInvoiceItem(invoiceId, data) {
  const quantity = Math.max(1, Number.parseInt(data.quantity, 10) || 1);
  const price = Number(data.unit_price);
  const gstRate = Number(data.gst_percentage);

  const itemCodeBase = (data.item_name || "ITEM").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  const itemCode = `${itemCodeBase || "ITEM"}-${Date.now()}`;

  const createdItemResponse = await api.post("items/", {
    item_code: itemCode,
    item_name: data.item_name,
    quantity,
    price,
    gst_rate: gstRate,
  });

  const createdItem = createdItemResponse?.data;

  const response = await api.post("invoice-items/", {
    invoice: Number(invoiceId),
    item: createdItem.id,
    quantity,
    price,
    gst_rate: gstRate,
  });
  return response.data;
}

export async function deleteInvoiceItem(id) {
  const response = await api.delete(`invoice-items/${id}/`);
  return response.data;
}

export async function downloadInvoicePdf(invoiceId) {
  const response = await api.get(`invoices/${invoiceId}/pdf/`, {
    responseType: "blob",
  });
  return response;
}

export async function sendInvoiceEmail(invoiceId) {
  const response = await api.post(`invoices/${invoiceId}/send-email/`);
  return response.data;
}
