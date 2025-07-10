// API Client for MarketSage

// Lists
export const getLists = async () => {
  const response = await fetch('/api/lists');
  if (!response.ok) {
    throw new Error('Failed to fetch lists');
  }
  return response.json();
};

export const getListById = async (id: string) => {
  const response = await fetch(`/api/lists/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch list');
  }
  return response.json();
};

export const getListsWithContactCount = async () => {
  const response = await fetch('/api/lists?includeCount=true');
  if (!response.ok) {
    throw new Error('Failed to fetch lists with contact count');
  }
  return response.json();
};

// Segments
export const getSegments = async () => {
  const response = await fetch('/api/segments');
  if (!response.ok) {
    throw new Error('Failed to fetch segments');
  }
  return response.json();
};

export const getSegmentById = async (id: string) => {
  const response = await fetch(`/api/segments/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch segment');
  }
  return response.json();
};

export const getSegmentsWithContactCount = async () => {
  const response = await fetch('/api/segments?includeCount=true');
  if (!response.ok) {
    throw new Error('Failed to fetch segments with contact count');
  }
  return response.json();
};

// Email Templates
export const getEmailTemplates = async () => {
  const response = await fetch('/api/email/templates');
  if (!response.ok) {
    throw new Error('Failed to fetch email templates');
  }
  return response.json();
};

export const getEmailTemplateById = async (id: string) => {
  const response = await fetch(`/api/email/templates/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch email template');
  }
  return response.json();
};

// Email Campaigns
export const getEmailCampaigns = async () => {
  const response = await fetch('/api/email/campaigns');
  if (!response.ok) {
    throw new Error('Failed to fetch email campaigns');
  }
  return response.json();
};

export const getEmailCampaignById = async (id: string) => {
  const response = await fetch(`/api/email/campaigns/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch email campaign');
  }
  return response.json();
};

export const getEmailCampaignStats = async (id: string) => {
  const response = await fetch(`/api/email/campaigns/${id}/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch email campaign statistics');
  }
  return response.json();
};

// SMS Templates
export const getSMSTemplates = async () => {
  const response = await fetch('/api/sms/templates');
  if (!response.ok) {
    throw new Error('Failed to fetch SMS templates');
  }
  return response.json();
};

export const getSMSTemplateById = async (id: string) => {
  const response = await fetch(`/api/sms/templates/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch SMS template');
  }
  return response.json();
};

// SMS Campaigns
export const getSMSCampaigns = async () => {
  const response = await fetch('/api/sms/campaigns');
  if (!response.ok) {
    throw new Error('Failed to fetch SMS campaigns');
  }
  const data = await response.json();
  // Return the campaigns array if the response is an object with campaigns property
  return Array.isArray(data) ? data : (data?.campaigns || []);
};

export const getSMSCampaignById = async (id: string) => {
  try {
    const response = await fetch(`/api/sms/campaigns/${id}`);
    
    if (response.status === 404) {
      return null; // Return null for not found
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch SMS campaign');
    }
    
    return response.json();
  } catch (error) {
    console.error("Error fetching SMS campaign:", error);
    throw error;
  }
};

export const getSMSCampaignStats = async (id: string) => {
  const response = await fetch(`/api/sms/campaigns/${id}/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch SMS campaign statistics');
  }
  return response.json();
};

// Contacts
export const getContacts = async () => {
  const response = await fetch('/api/contacts');
  if (!response.ok) {
    throw new Error('Failed to fetch contacts');
  }
  return response.json();
};

export const getContactById = async (id: string) => {
  const response = await fetch(`/api/contacts/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch contact');
  }
  return response.json();
};

// WhatsApp Templates
export const getWhatsAppTemplates = async () => {
  try {
    const response = await fetch('/api/whatsapp/templates');
    
    if (response.status === 404) {
      console.warn('WhatsApp templates endpoint not found, returning empty array');
      return []; // Return empty array if endpoint not found
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch WhatsApp templates: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error("Error fetching WhatsApp templates:", error);
    // Return empty array instead of throwing to prevent UI failures
    return [];
  }
};

export const getWhatsAppTemplateById = async (id: string) => {
  const response = await fetch(`/api/whatsapp/templates/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch WhatsApp template');
  }
  return response.json();
};

// WhatsApp Campaigns
export const getWhatsAppCampaigns = async () => {
  const response = await fetch('/api/whatsapp/campaigns');
  if (!response.ok) {
    throw new Error('Failed to fetch WhatsApp campaigns');
  }
  const data = await response.json();
  // Return the campaigns array if the response is an object with campaigns property
  return Array.isArray(data) ? data : (data?.campaigns || []);
};

export const getWhatsAppCampaignById = async (id: string) => {
  try {
    const response = await fetch(`/api/whatsapp/campaigns/${id}`);
    
    if (response.status === 404) {
      return null; // Return null for not found
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch WhatsApp campaign');
    }
    
    return response.json();
  } catch (error) {
    console.error("Error fetching WhatsApp campaign:", error);
    throw error;
  }
};

export const getWhatsAppCampaignStats = async (id: string) => {
  const response = await fetch(`/api/whatsapp/campaigns/${id}/statistics`);
  if (!response.ok) {
    throw new Error('Failed to fetch WhatsApp campaign statistics');
  }
  return response.json();
};

export const sendWhatsAppCampaign = async (id: string) => {
  const response = await fetch(`/api/whatsapp/campaigns/${id}/send`, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error('Failed to send WhatsApp campaign');
  }
  
  return response.json();
};

export const scheduleWhatsAppCampaign = async (id: string, scheduledFor: string) => {
  const response = await fetch(`/api/whatsapp/campaigns/${id}/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ scheduledFor })
  });
  
  if (!response.ok) {
    throw new Error('Failed to schedule WhatsApp campaign');
  }
  
  return response.json();
};

export const cancelScheduledWhatsAppCampaign = async (id: string) => {
  const response = await fetch(`/api/whatsapp/campaigns/${id}/schedule`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error('Failed to cancel scheduled WhatsApp campaign');
  }
  
  return response.json();
}; 