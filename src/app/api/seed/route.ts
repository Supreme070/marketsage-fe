import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { 
  handleApiError, 
  unauthorized, 
  forbidden,
  notFound,
  validationError 
} from "@/lib/errors";

// POST endpoint to seed WhatsApp data
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated with admin role
  if (!session || !session.user || !(session.user.role === "SUPER_ADMIN" || session.user.role === "ADMIN" || session.user.role === "IT_ADMIN")) {
    return unauthorized();
  }

  try {
    // Get the admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        id: session.user.id
      }
    });

    if (!adminUser) {
      return notFound("Admin user not found");
    }

    // Create WhatsApp templates
    const welcomeTemplate = await prisma.whatsAppTemplate.create({
      data: {
        name: 'Welcome Message',
        content: 'Hello {{1}}, welcome to our service! We\'re excited to have you on board.',
        status: 'APPROVED',
        variables: JSON.stringify(['name']),
        createdById: adminUser.id,
      }
    });

    const orderTemplate = await prisma.whatsAppTemplate.create({
      data: {
        name: 'Order Confirmation',
        content: 'Hi {{1}}, your order #{{2}} has been confirmed. Thank you for shopping with us!',
        status: 'APPROVED',
        variables: JSON.stringify(['name', 'orderNumber']),
        createdById: adminUser.id,
      }
    });

    const appointmentTemplate = await prisma.whatsAppTemplate.create({
      data: {
        name: 'Appointment Reminder',
        content: 'Reminder: You have an appointment scheduled for {{1}} at {{2}}. Please reply YES to confirm.',
        status: 'APPROVED',
        variables: JSON.stringify(['date', 'time']),
        createdById: adminUser.id,
      }
    });

    // Get or create a contact list
    let contactList = await prisma.list.findFirst();
    if (!contactList) {
      contactList = await prisma.list.create({
        data: {
          name: 'Sample Contact List',
          description: 'A sample list of contacts for testing',
          createdById: adminUser.id,
        }
      });
      
      // Add sample contacts
      const john = await prisma.contact.create({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          createdById: adminUser.id,
        }
      });
      
      const jane = await prisma.contact.create({
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+1987654321',
          createdById: adminUser.id,
        }
      });
      
      // Connect contacts to list
      await prisma.listMember.createMany({
        data: [
          { listId: contactList.id, contactId: john.id },
          { listId: contactList.id, contactId: jane.id }
        ]
      });
    }

    // Create WhatsApp campaigns
    const draftCampaign = await prisma.whatsAppCampaign.create({
      data: {
        name: 'Welcome Campaign',
        description: 'A campaign to welcome new users',
        from: '+19876543210',
        status: 'DRAFT',
        templateId: welcomeTemplate.id,
        content: welcomeTemplate.content,
        createdById: adminUser.id,
        lists: { connect: { id: contactList.id } }
      }
    });

    const scheduledCampaign = await prisma.whatsAppCampaign.create({
      data: {
        name: 'Order Follow-up',
        description: 'Follow up on recent orders',
        from: '+19876543210',
        status: 'SCHEDULED',
        templateId: orderTemplate.id,
        content: orderTemplate.content,
        createdById: adminUser.id,
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
        lists: { connect: { id: contactList.id } }
      }
    });

    const sentCampaign = await prisma.whatsAppCampaign.create({
      data: {
        name: 'Appointment Reminder',
        description: 'Reminder for upcoming appointments',
        from: '+19876543210',
        status: 'SENT',
        templateId: appointmentTemplate.id,
        content: appointmentTemplate.content,
        createdById: adminUser.id,
        sentAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        lists: { connect: { id: contactList.id } }
      }
    });

    // Get contacts in the list
    const listMembers = await prisma.listMember.findMany({
      where: {
        listId: contactList.id
      },
      include: {
        contact: true
      }
    });
    
    const contacts = listMembers.map(member => member.contact);
    
    // Create activities for the sent campaign
    if (contacts.length > 0) {
      await Promise.all(
        contacts.map(contact => 
          prisma.whatsAppActivity.create({
            data: {
              campaignId: sentCampaign.id,
              contactId: contact.id,
              type: 'DELIVERED',
              timestamp: new Date(Date.now() - 47 * 60 * 60 * 1000),
              metadata: JSON.stringify({ status: 'delivered' })
            }
          })
        )
      );
    }

    return NextResponse.json({
      success: true,
      message: "Sample WhatsApp data created successfully",
      data: {
        templates: [welcomeTemplate, orderTemplate, appointmentTemplate],
        campaigns: [draftCampaign, scheduledCampaign, sentCampaign],
        contactsCount: contacts.length
      }
    });
  } catch (error: any) {
    console.error("Error seeding WhatsApp data:", error);
    return NextResponse.json(
      { error: "Failed to seed WhatsApp data", details: error.message },
      { status: 500 }
    );
  }
} 