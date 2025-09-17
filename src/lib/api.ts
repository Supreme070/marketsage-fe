// API Client for MarketSage

// Lists
export const getLists = async () => {
  const response = await fetch('/api/v2/lists');
  if (!response.ok) {
    throw new Error('Failed to fetch lists');
  }
  return response.json();
};

export const getListById = async (id: string) => {
  const response = await fetch(`/api/v2/lists/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch list');
  }
  return response.json();
};

export const getListsWithContactCount = async () => {
  const response = await fetch('/api/v2/lists?includeCount=true');
  if (!response.ok) {
    throw new Error('Failed to fetch lists with contact count');
  }
  return response.json();
};

// Segments
export const getSegments = async () => {
  const response = await fetch('/api/v2/segments');
  if (!response.ok) {
    throw new Error('Failed to fetch segments');
  }
  return response.json();
};

export const getSegmentById = async (id: string) => {
  const response = await fetch(`/api/v2/segments/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch segment');
  }
  return response.json();
};

export const getSegmentsWithContactCount = async () => {
  const response = await fetch('/api/v2/segments?includeCount=true');
  if (!response.ok) {
    throw new Error('Failed to fetch segments with contact count');
  }
  return response.json();
};

// Email Templates
export const getEmailTemplates = async () => {
  const response = await fetch('/api/v2/email/templates');
  if (!response.ok) {
    throw new Error('Failed to fetch email templates');
  }
  return response.json();
};

export const getEmailTemplateById = async (id: string) => {
  const response = await fetch(`/api/v2/email/templates/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch email template');
  }
  return response.json();
};

// Email Campaigns
export const getEmailCampaigns = async () => {
  const response = await fetch('/api/v2/email/campaigns');
  if (!response.ok) {
    throw new Error('Failed to fetch email campaigns');
  }
  const data = await response.json();
  
  // Check if response indicates an error
  if (data && typeof data === 'object' && data.success === false) {
    throw new Error(data.error?.message || 'API returned an error');
  }
  
  return data;
};

export const getEmailCampaignById = async (id: string) => {
  const response = await fetch(`/api/v2/email/campaigns/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch email campaign');
  }
  return response.json();
};

export const getEmailCampaignStats = async (id: string) => {
  const response = await fetch(`/api/v2/email/campaigns/${id}/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch email campaign statistics');
  }
  return response.json();
};

// SMS Templates
export const getSMSTemplates = async () => {
  const response = await fetch('/api/v2/sms/templates');
  if (!response.ok) {
    throw new Error('Failed to fetch SMS templates');
  }
  return response.json();
};

export const getSMSTemplateById = async (id: string) => {
  const response = await fetch(`/api/v2/sms/templates/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch SMS template');
  }
  return response.json();
};

// SMS Campaigns
export const getSMSCampaigns = async () => {
  const response = await fetch('/api/v2/sms/campaigns');
  if (!response.ok) {
    throw new Error('Failed to fetch SMS campaigns');
  }
  const data = await response.json();
  // Return the campaigns array if the response is an object with campaigns property
  return Array.isArray(data) ? data : (data?.campaigns || []);
};

export const getSMSCampaignById = async (id: string) => {
  try {
    const response = await fetch(`/api/v2/sms/campaigns/${id}`);
    
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
  const response = await fetch(`/api/v2/sms/campaigns/${id}/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch SMS campaign statistics');
  }
  return response.json();
};

// Contacts
export const getContacts = async () => {
  const response = await fetch('/api/v2/contacts');
  if (!response.ok) {
    throw new Error('Failed to fetch contacts');
  }
  return response.json();
};

export const getContactById = async (id: string) => {
  const response = await fetch(`/api/v2/contacts/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch contact');
  }
  return response.json();
};

// WhatsApp Templates
export const getWhatsAppTemplates = async () => {
  try {
    const response = await fetch('/api/v2/whatsapp/templates');
    
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
  const response = await fetch(`/api/v2/whatsapp/templates/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch WhatsApp template');
  }
  return response.json();
};

// WhatsApp Campaigns
export const getWhatsAppCampaigns = async () => {
  const response = await fetch('/api/v2/whatsapp/campaigns');
  if (!response.ok) {
    throw new Error('Failed to fetch WhatsApp campaigns');
  }
  const data = await response.json();
  
  // Check if response indicates an error
  if (data && typeof data === 'object' && data.success === false) {
    throw new Error(data.error?.message || 'API returned an error');
  }
  
  // Return the campaigns array if the response is an object with campaigns property
  return Array.isArray(data) ? data : (data?.campaigns || []);
};

export const getWhatsAppCampaignById = async (id: string) => {
  try {
    const response = await fetch(`/api/v2/whatsapp/campaigns/${id}`);
    
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
  const response = await fetch(`/api/v2/whatsapp/campaigns/${id}/analytics`);
  if (!response.ok) {
    throw new Error('Failed to fetch WhatsApp campaign statistics');
  }
  return response.json();
};

export const sendWhatsAppCampaign = async (id: string) => {
  const response = await fetch(`/api/v2/whatsapp/campaigns/${id}/send`, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error('Failed to send WhatsApp campaign');
  }
  
  return response.json();
};

export const scheduleWhatsAppCampaign = async (id: string, scheduledFor: string) => {
  const response = await fetch(`/api/v2/whatsapp/campaigns/${id}/send`, {
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
  const response = await fetch(`/api/v2/whatsapp/campaigns/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'CANCELLED' })
  });
  
  if (!response.ok) {
    throw new Error('Failed to cancel scheduled WhatsApp campaign');
  }
  
  return response.json();
}; 