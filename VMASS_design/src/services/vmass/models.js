export const VMASS_MODELS = {
  "Affiliate": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": "Sequelize.UUIDV4",
      "primaryKey": true,
      "unique": true
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "email": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": true
    },
    "password": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "phone": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"pending\"",
      "primaryKey": null,
      "unique": null
    },
    "tier": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"bronze\"",
      "primaryKey": null,
      "unique": null
    },
    "balance": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "bank_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "bank_number": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "bank_holder": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "AffiliateCampaign": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": "Sequelize.UUIDV4",
      "primaryKey": true,
      "unique": true
    },
    "affiliate_id": {
      "type": "Sequelize.UUID",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "landing_url": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"active\"",
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "AffiliateClick": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": "Sequelize.UUIDV4",
      "primaryKey": true,
      "unique": true
    },
    "link_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "ip_address": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_agent": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "referrer": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "AffiliateConversion": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": "Sequelize.UUIDV4",
      "primaryKey": true,
      "unique": true
    },
    "affiliate_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "link_id": {
      "type": "Sequelize.UUID",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "customer_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "type": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "amount": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "commission_amount": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"pending\"",
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "AffiliateLink": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": "Sequelize.UUIDV4",
      "primaryKey": true,
      "unique": true
    },
    "affiliate_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "campaign_id": {
      "type": "Sequelize.UUID",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "code": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": true
    },
    "original_url": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_default": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "clicks": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "ai_audit_log": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": null,
      "defaultValue": "Sequelize.UUIDV4",
      "primaryKey": true,
      "unique": null
    },
    "shop_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "session_id": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "input_text": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "intent_detected": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "plan_json": {
      "type": "Sequelize.JSONB",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "tool_calls": {
      "type": "Sequelize.JSONB",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "final_response": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "token_usage": {
      "type": "Sequelize.JSONB",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "ai_config": {
    "id": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": true,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": true
    },
    "page_id": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "provider": {
      "type": "Sequelize.STRING",
      "allowNull": null,
      "defaultValue": "\"gemini\"",
      "primaryKey": null,
      "unique": null
    },
    "gemini_api_key": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "openai_api_key": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "backup_enabled": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": null,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    },
    "bot_persona": {
      "type": "Sequelize.TEXT",
      "allowNull": null,
      "defaultValue": "\"Bạn là nhân viên hỗ trợ khách hàng thân thiện",
      "primaryKey": null,
      "unique": null
    },
    "knowledge_base": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_enabled": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": null,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "ai_conversation": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": null,
      "defaultValue": "Sequelize.UUIDV4",
      "primaryKey": true,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "tenant_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "title": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"active\"",
      "primaryKey": null,
      "unique": null
    }
  },
  "ai_feedback": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": null,
      "defaultValue": "Sequelize.UUIDV4",
      "primaryKey": true,
      "unique": null
    },
    "conversation_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "message_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "rating": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "comment": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "ai_message": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": null,
      "defaultValue": "Sequelize.UUIDV4",
      "primaryKey": true,
      "unique": null
    },
    "conversation_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "role": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "content_text": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "content_json": {
      "type": "Sequelize.JSONB",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "tool_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "tool_result_json": {
      "type": "Sequelize.JSONB",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "latency_ms": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "Alert": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "isSeen": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "type": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "title": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "item_id": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "ApiKey": {
    "partner_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "key_prefix": {
      "type": "Sequelize.STRING(12)",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "key_hash": {
      "type": "Sequelize.STRING(64)",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "environment": {
      "type": "Sequelize.ENUM(\"live\"",
      "allowNull": false,
      "defaultValue": "\"test\"",
      "primaryKey": null,
      "unique": null
    },
    "last_used_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "expires_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_active": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    },
    "request_count": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    }
  },
  "ApiLog": {
    "partner_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "api_key_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "method": {
      "type": "Sequelize.STRING(10)",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "path": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "query_params": {
      "type": "Sequelize.JSON",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status_code": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "response_time_ms": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "ip_address": {
      "type": "Sequelize.STRING(45)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_agent": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "request_body": {
      "type": "Sequelize.JSON",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "error_message": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "error_code": {
      "type": "Sequelize.STRING(50)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "ApiPartner": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "partner_name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "partner_type": {
      "type": "Sequelize.ENUM(",
      "allowNull": false,
      "defaultValue": "\"other\"",
      "primaryKey": null,
      "unique": null
    },
    "contact_email": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "contact_phone": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_active": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    },
    "permissions": {
      "type": "Sequelize.JSON",
      "allowNull": false,
      "defaultValue": "[]",
      "primaryKey": null,
      "unique": null
    },
    "rate_limit": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "1000",
      "primaryKey": null,
      "unique": null
    },
    "webhook_url": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "webhook_secret": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "description": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "AutoReplyRule": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "page_id": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "trigger_type": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"keyword\"",
      "primaryKey": null,
      "unique": null
    },
    "trigger_value": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "response_type": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"text\"",
      "primaryKey": null,
      "unique": null
    },
    "response_value": {
      "type": "Sequelize.TEXT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_active": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    },
    "priority": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "match_count": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    }
  },
  "Bill": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_test": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "Booking": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "table_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "customer_id": {
      "type": "Sequelize.UUID",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "customer_name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "customer_phone": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "customer_email": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "booking_date": {
      "type": "Sequelize.DATEONLY",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "booking_time": {
      "type": "Sequelize.TIME",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "duration_minutes": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "120",
      "primaryKey": null,
      "unique": null
    },
    "party_size": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "2",
      "primaryKey": null,
      "unique": null
    },
    "special_requests": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "'pending'",
      "primaryKey": null,
      "unique": null
    },
    "deposit_amount": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "deposit_paid": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "notes": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "confirmed_by": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "confirmed_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "source": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "'phone'",
      "primaryKey": null,
      "unique": null
    },
    "confirmation_email_sent": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "reminder_email_sent": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "BookingSetting": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": true
    },
    "booking_enabled": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "max_party_size": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "20",
      "primaryKey": null,
      "unique": null
    },
    "min_advance_hours": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "2",
      "primaryKey": null,
      "unique": null
    },
    "max_advance_days": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "30",
      "primaryKey": null,
      "unique": null
    },
    "time_slots": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "slot_duration": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "30",
      "primaryKey": null,
      "unique": null
    },
    "default_duration": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "120",
      "primaryKey": null,
      "unique": null
    },
    "deposit_required": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "deposit_amount": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "deposit_percent": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "send_confirmation_email": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    },
    "send_reminder_email": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    },
    "reminder_hours_before": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "2",
      "primaryKey": null,
      "unique": null
    },
    "auto_confirm": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "Category": {
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "ChatLog": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "message": {
      "type": "Sequelize.TEXT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "friend_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "isSeen": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "filePath": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "ChatLogGuest": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "message": {
      "type": "Sequelize.TEXT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "table_chair_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sender_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "receive_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "isSeen": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "Commission": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": "Sequelize.UUIDV4",
      "primaryKey": true,
      "unique": true
    },
    "affiliate_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "conversion_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "amount": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"pending\"",
      "primaryKey": null,
      "unique": null
    },
    "approved_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "payout_id": {
      "type": "Sequelize.UUID",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "CompanyProvider": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "phone": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "email": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "address": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "total_price_income": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"0\"",
      "primaryKey": null,
      "unique": null
    },
    "total_price_outcome": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"0\"",
      "primaryKey": null,
      "unique": null
    },
    "total_price_pending": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"0\"",
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "CompanyProviderItem": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "company_provider_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "stock_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "alias": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"new\"",
      "primaryKey": null,
      "unique": null
    },
    "price_income": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"0\"",
      "primaryKey": null,
      "unique": null
    },
    "quantity": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "CompanyProviderItemLog": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "company_provider_item_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "price_outcome": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"0\"",
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "type": {
      "type": "Sequelize.ENUM('income'",
      "allowNull": false,
      "defaultValue": "'income'  // Mặc định là thêm giao dịch",
      "primaryKey": null,
      "unique": null
    }
  },
  "Contact": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "friend_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "Customer": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "phone": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "email": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "address": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "point": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "armorial": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "used": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "debt": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "CustomerOrder": {
    "customer_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "order_pin": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "isDone": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "CustomerTag": {
    "customer_id": {
      "type": "Sequelize.UUID",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "alias": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"new\"",
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "Discount": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "order_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "max": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "type": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "value": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "note": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "pin": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "EInvoice": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "order_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "bill_id": {
      "type": "Sequelize.STRING(100)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "provider": {
      "type": "Sequelize.STRING(20)",
      "allowNull": false,
      "defaultValue": "\"misa\"",
      "primaryKey": null,
      "unique": null
    },
    "provider_invoice_id": {
      "type": "Sequelize.STRING(100)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "invoice_no": {
      "type": "Sequelize.STRING(20)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "invoice_series": {
      "type": "Sequelize.STRING(20)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "invoice_date": {
      "type": "Sequelize.DATEONLY",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "customer_name": {
      "type": "Sequelize.STRING(255)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "customer_tax_id": {
      "type": "Sequelize.STRING(20)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "customer_address": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "customer_email": {
      "type": "Sequelize.STRING(100)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "customer_phone": {
      "type": "Sequelize.STRING(20)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "subtotal": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "vat_rate": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "10",
      "primaryKey": null,
      "unique": null
    },
    "vat_amount": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "total_amount": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "discount_amount": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "payment_method": {
      "type": "Sequelize.STRING(50)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "items": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING(20)",
      "allowNull": false,
      "defaultValue": "\"draft\"",
      "primaryKey": null,
      "unique": null
    },
    "pdf_url": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "xml_url": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "note": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "provider_response": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "error_message": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "issued_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "cancelled_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sent_email_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "EInvoiceConfig": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "provider": {
      "type": "Sequelize.STRING(20)",
      "allowNull": false,
      "defaultValue": "\"misa\"",
      "primaryKey": null,
      "unique": null
    },
    "api_url": {
      "type": "Sequelize.STRING(255)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "app_id": {
      "type": "Sequelize.STRING(100)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "api_key": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "username": {
      "type": "Sequelize.STRING(100)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "password": {
      "type": "Sequelize.STRING(255)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "company_tax_id": {
      "type": "Sequelize.STRING(20)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "company_name": {
      "type": "Sequelize.STRING(255)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "company_address": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "company_phone": {
      "type": "Sequelize.STRING(20)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "company_email": {
      "type": "Sequelize.STRING(100)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "company_bank_account": {
      "type": "Sequelize.STRING(50)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "company_bank_name": {
      "type": "Sequelize.STRING(100)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "invoice_series": {
      "type": "Sequelize.STRING(20)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "invoice_template": {
      "type": "Sequelize.STRING(50)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "vat_rate": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "10",
      "primaryKey": null,
      "unique": null
    },
    "is_active": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    },
    "esign_provider": {
      "type": "Sequelize.STRING(50)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "esign_username": {
      "type": "Sequelize.STRING(100)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "esign_password": {
      "type": "Sequelize.STRING(255)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "esign_serial": {
      "type": "Sequelize.STRING(100)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sign_type": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "1",
      "primaryKey": null,
      "unique": null
    },
    "last_token": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "token_expires_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sepay_client_id": {
      "type": "Sequelize.STRING(100)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sepay_client_secret": {
      "type": "Sequelize.STRING(255)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sepay_account_id": {
      "type": "Sequelize.STRING(100)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "template_code": {
      "type": "Sequelize.STRING(50)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "auto_issue": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "create_draft_when_not_issue": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    }
  },
  "FacebookComment": {
    "comment_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": true
    },
    "post_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "parent_id": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "page_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sender_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sender_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "message": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "attachment_url": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_hidden": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": null,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "is_read": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": null,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "is_replied": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": null,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "is_liked": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": null,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "reaction_type": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "created_time": {
      "type": "Sequelize.DATE",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "FacebookConversation": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "page_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "psid": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "customer_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "customer_profile_pic": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "last_message": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "last_message_time": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_read": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "tags": {
      "type": "Sequelize.JSON",
      "allowNull": true,
      "defaultValue": "[]",
      "primaryKey": null,
      "unique": null
    },
    "internal_notes": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "priority": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": "\"normal\"",
      "primaryKey": null,
      "unique": null
    },
    "last_customer_message_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "FacebookMessage": {
    "conversation_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "page_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "psid": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sender_type": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "message_id": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "message_text": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "attachment_type": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "attachment_url": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "timestamp": {
      "type": "Sequelize.DATE",
      "allowNull": false,
      "defaultValue": "Sequelize.NOW",
      "primaryKey": null,
      "unique": null
    }
  },
  "FacebookPage": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "page_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "page_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "page_access_token": {
      "type": "Sequelize.TEXT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "page_picture": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_active": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    },
    "webhook_verified": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "last_subscribed_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "last_synced_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "FacebookPost": {
    "post_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": true
    },
    "page_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "message": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "permalink_url": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "created_time": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "attachments": {
      "type": "Sequelize.JSON",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "like_count": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "comment_count": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "share_count": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    }
  },
  "Faq": {
    "title": {
      "type": "Sequelize.TEXT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "content": {
      "type": "Sequelize.TEXT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "order": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "fb_accounts": {
    "id": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": true,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "fb_user_id": {
      "type": "Sequelize.STRING(50)",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "ad_account_id": {
      "type": "Sequelize.STRING(50)",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "access_token": {
      "type": "Sequelize.TEXT",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "token_expires_at": {
      "type": "Sequelize.DATE",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "business_id": {
      "type": "Sequelize.STRING(50)",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "fb_campaigns_cache": {
    "id": {
      "type": "Sequelize.STRING(50)",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": true,
      "unique": null
    },
    "ad_account_id": {
      "type": "Sequelize.STRING(50)",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name": {
      "type": "Sequelize.STRING(255)",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING(20)",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "objective": {
      "type": "Sequelize.STRING(50)",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "budget_type": {
      "type": "Sequelize.STRING(20)",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "daily_budget": {
      "type": "Sequelize.BIGINT",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "lifetime_budget": {
      "type": "Sequelize.BIGINT",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "data_json": {
      "type": "Sequelize.JSONB",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "synced_at": {
      "type": "Sequelize.DATE",
      "allowNull": null,
      "defaultValue": "Sequelize.NOW",
      "primaryKey": null,
      "unique": null
    }
  },
  "fb_insights_cache": {
    "id": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": true,
      "unique": null
    },
    "object_id": {
      "type": "Sequelize.STRING(50)",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "object_type": {
      "type": "Sequelize.STRING(20)",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date_start": {
      "type": "Sequelize.DATEONLY",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date_stop": {
      "type": "Sequelize.DATEONLY",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "impressions": {
      "type": "Sequelize.BIGINT",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "clicks": {
      "type": "Sequelize.BIGINT",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "spend": {
      "type": "Sequelize.DECIMAL(12",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "cpc": {
      "type": "Sequelize.DECIMAL(8",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "cpm": {
      "type": "Sequelize.DECIMAL(8",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "ctr": {
      "type": "Sequelize.DECIMAL(8",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "conversions": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "cost_per_conversion": {
      "type": "Sequelize.DECIMAL(10",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "roas": {
      "type": "Sequelize.DECIMAL(8",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "data_json": {
      "type": "Sequelize.JSONB",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "synced_at": {
      "type": "Sequelize.DATE",
      "allowNull": null,
      "defaultValue": "Sequelize.NOW",
      "primaryKey": null,
      "unique": null
    }
  },
  "FbLiveMetricsSnapshot": {
    "id": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": true,
      "unique": null
    },
    "live_video_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "timestamp": {
      "type": "Sequelize.DATE",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "live_viewers": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    }
  },
  "FbLiveOrder": {
    "id": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": true,
      "unique": null
    },
    "live_video_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "page_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "customer_psid": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "customer_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "product_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "quantity": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": "1",
      "primaryKey": null,
      "unique": null
    },
    "total_price": {
      "type": "Sequelize.DOUBLE",
      "allowNull": null,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": null,
      "defaultValue": "'pending'",
      "primaryKey": null,
      "unique": null
    },
    "system_order_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "comment_id": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "FbLiveSession": {
    "live_video_id": {
      "type": "Sequelize.STRING",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": true,
      "unique": null
    },
    "page_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": null,
      "defaultValue": "'LIVE'",
      "primaryKey": null,
      "unique": null
    },
    "title": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "description": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "post_id": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "started_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "ended_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "peak_viewers": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "revenue": {
      "type": "Sequelize.DOUBLE",
      "allowNull": null,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "total_orders": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "total_comments": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "total_reactions": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "total_shares": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "total_reach": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    }
  },
  "FeeOther": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "order_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "value": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "type": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "note": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "pin": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "Form": {
    "alias": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "FormDynamic": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "form_alias": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "label": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "type": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "order": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "FormDynamicLog": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "form_dynamic_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "item_id": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "form_alias": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "value": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "Income": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sub_title": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "value": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "note": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "address": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_created_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "IncomeLog": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "income_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_created_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "value": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "InventoryAudit": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": null,
      "defaultValue": "Sequelize.UUIDV4",
      "primaryKey": true,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "audit_code": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": true
    },
    "audit_date": {
      "type": "Sequelize.DATEONLY",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.ENUM(\"draft\"",
      "allowNull": false,
      "defaultValue": "\"draft\"",
      "primaryKey": null,
      "unique": null
    },
    "notes": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "created_by": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "total_discrepancy_value": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    }
  },
  "InventoryAuditItem": {
    "id": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": true,
      "unique": null
    },
    "audit_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "stock_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "system_quantity": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "actual_quantity": {
      "type": "Sequelize.FLOAT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "discrepancy": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "reason": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "KnowledgeVector": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": null,
      "defaultValue": "Sequelize.UUIDV4",
      "primaryKey": true,
      "unique": null
    },
    "shop_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "content": {
      "type": "Sequelize.TEXT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "metadata": {
      "type": "Sequelize.JSONB",
      "allowNull": null,
      "defaultValue": "{}",
      "primaryKey": null,
      "unique": null
    },
    "embedding": {
      "type": "Sequelize.JSONB",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "Log": {
    "message": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "MakeProduct": {
    "count": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "product_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "stock_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "OneTimeNotification": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "page_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "psid": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "token": {
      "type": "Sequelize.TEXT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "title": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "payload": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"available\"",
      "primaryKey": null,
      "unique": null
    },
    "used_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "expires_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "Order": {
    "bill_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "product_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "product_variant_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "paymented": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "count": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "price": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "note": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "phone": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_identify": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "table_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "pin": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "pin_print": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "pin_table": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "ice": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sugar": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "size": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "topping": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "stock_deducted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "payment_method": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"cash\"",
      "primaryKey": null,
      "unique": null
    },
    "staff_id": {
      "type": "Sequelize.UUID",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_test": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "otp": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": null,
      "defaultValue": "Sequelize.UUIDV4",
      "primaryKey": true,
      "unique": null
    },
    "phone": {
      "type": "Sequelize.STRING(15)",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "code": {
      "type": "Sequelize.STRING(6)",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "expiresAt": {
      "type": "Sequelize.DATE",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "verified": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": null,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "attempts": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    }
  },
  "Outcome": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sub_title": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "alias": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "value": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "note": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "address": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_created_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "OutcomeLog": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "outcome_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_created_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "value": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "Payout": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": "Sequelize.UUIDV4",
      "primaryKey": true,
      "unique": true
    },
    "affiliate_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "amount": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"pending\"",
      "primaryKey": null,
      "unique": null
    },
    "proof_image": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "admin_note": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "Product": {
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sku": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "barcode": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "image": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "images": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "price": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "price_sale": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "active_sale": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "category_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softHide": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "bestter": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "ProductMapping": {
    "product_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "variant_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "platform": {
      "type": "Sequelize.STRING(20)",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "shop_id": {
      "type": "Sequelize.STRING(100)",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "platform_item_id": {
      "type": "Sequelize.STRING(100)",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "platform_sku": {
      "type": "Sequelize.STRING(100)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "platform_name": {
      "type": "Sequelize.STRING(500)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "platform_price": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "platform_stock": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "platform_image": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sync_enabled": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    },
    "last_synced_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "ProductPairing": {
    "product_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "paired_product_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "co_occurrence_count": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "last_computed": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "ProductSetting": {
    "product_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "alias": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "value": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "promo_price": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "ProductVariant": {
    "id": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": true,
      "unique": null
    },
    "product_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sku": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "price": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "cost_price": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "exchange_value": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "1",
      "primaryKey": null,
      "unique": null
    },
    "promo_price": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "quantity": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date_start": {
      "type": "Sequelize.DATEONLY",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date_end": {
      "type": "Sequelize.DATEONLY",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "attributes": {
      "type": "Sequelize.JSON",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "Promotion": {
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "description": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "code": {
      "type": "Sequelize.STRING(50)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "promotionType": {
      "type": "Sequelize.ENUM('DISCOUNT'",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "startDate": {
      "type": "Sequelize.DATE",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "endDate": {
      "type": "Sequelize.DATE",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "usageCount": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "maxUsageTotal": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "-1",
      "primaryKey": null,
      "unique": null
    },
    "maxUsagePerCustomer": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "1",
      "primaryKey": null,
      "unique": null
    },
    "isStackable": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "isAutoUse": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "isActive": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    },
    "activeDays": {
      "type": "Sequelize.JSON",
      "allowNull": true,
      "defaultValue": "null",
      "primaryKey": null,
      "unique": null
    },
    "activeTimeStart": {
      "type": "Sequelize.STRING(5)",
      "allowNull": true,
      "defaultValue": "null",
      "primaryKey": null,
      "unique": null
    },
    "activeTimeEnd": {
      "type": "Sequelize.STRING(5)",
      "allowNull": true,
      "defaultValue": "null",
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "PromotionAction": {
    "actionType": {
      "type": "Sequelize.ENUM(",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "discountValue": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "discountUnit": {
      "type": "Sequelize.ENUM('PERCENT'",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "maxDiscountAmount": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "actionItems": {
      "type": "Sequelize.JSONB",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "PromotionCondition": {
    "conditionType": {
      "type": "Sequelize.ENUM(",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "minValue": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "maxValue": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "itemList": {
      "type": "Sequelize.JSONB",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "PromotionUsageLog": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": "Sequelize.UUIDV4",
      "primaryKey": true,
      "unique": true
    },
    "promotion_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "customer_phone": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "bill_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "discount_amount": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "gift_items": {
      "type": "Sequelize.JSONB",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "order_total": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "QuickReplyTemplate": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "title": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "content": {
      "type": "Sequelize.TEXT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "shortcut": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "category": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": "\"general\"",
      "primaryKey": null,
      "unique": null
    },
    "is_active": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    }
  },
  "Role": {
    "alias": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "group": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "note": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "permissions": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "SepayTransaction": {
    "sepay_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": true
    },
    "reference_code": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "gateway": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "transaction_date": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "account_number": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "code": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "content": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "transfer_type": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "transfer_amount": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "accumulated": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sub_account": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "'pending'",
      "primaryKey": null,
      "unique": null
    },
    "processed_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "Setting": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "bill_cashier": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "bill_qr": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "bill_bar": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "tem_bar": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "tem_cashier": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "order_processing_one": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "order_processing_two": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "order_processing_three": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "order_processing_four": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    },
    "staff_shifts": {
      "type": "Sequelize.JSON",
      "allowNull": true,
      "defaultValue": "null",
      "primaryKey": null,
      "unique": null
    },
    "staff_positions": {
      "type": "Sequelize.JSON",
      "allowNull": true,
      "defaultValue": "null",
      "primaryKey": null,
      "unique": null
    },
    "customer_tiers": {
      "type": "Sequelize.JSON",
      "allowNull": true,
      "defaultValue": "[",
      "primaryKey": null,
      "unique": null
    },
    "point_conversion_rate": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "1000",
      "primaryKey": null,
      "unique": null
    },
    "email_config": {
      "type": "Sequelize.JSON",
      "allowNull": true,
      "defaultValue": "null",
      "primaryKey": null,
      "unique": null
    },
    "shift_required": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "report_time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"21\"",
      "primaryKey": null,
      "unique": null
    },
    "shopee_settings": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "ShiftSession": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "staff_id": {
      "type": "Sequelize.UUID",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "staff_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "shift_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": "\"Ca làm việc\"",
      "primaryKey": null,
      "unique": null
    },
    "opened_at": {
      "type": "Sequelize.DATE",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "closed_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"open\"",
      "primaryKey": null,
      "unique": null
    },
    "opening_cash": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "expected_cash": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "actual_cash": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "cash_difference": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "total_revenue": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "total_cash_revenue": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "total_transfer_revenue": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "total_card_revenue": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "total_credit_revenue": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "total_orders": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "total_products": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "note": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "adjustment_amount": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "adjustment_type": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "adjustment_reason": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "final_difference": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "discrepancy_action": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "ShippingOrder": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "bill_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "provider": {
      "type": "Sequelize.ENUM(\"ghn\"",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "tracking_code": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "order_code": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"pending\"",
      "primaryKey": null,
      "unique": null
    },
    "status_text": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "shipping_fee": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "cod_amount": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "sender_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sender_phone": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sender_address": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sender_district_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sender_ward_code": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "receiver_name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "receiver_phone": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "receiver_address": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "receiver_province_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "receiver_district_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "receiver_ward_code": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "weight": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "500",
      "primaryKey": null,
      "unique": null
    },
    "length": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "20",
      "primaryKey": null,
      "unique": null
    },
    "width": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "20",
      "primaryKey": null,
      "unique": null
    },
    "height": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "10",
      "primaryKey": null,
      "unique": null
    },
    "note": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "items": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "provider_response": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "expected_delivery_time": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "ShippingProvider": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "provider": {
      "type": "Sequelize.ENUM(\"ghn\"",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "api_token": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "shop_id": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "client_id": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "secret_key": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "from_province_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "from_district_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "from_ward_code": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_active": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    },
    "is_default": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "is_sandbox": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "default_weight": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "500",
      "primaryKey": null,
      "unique": null
    },
    "default_length": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "20",
      "primaryKey": null,
      "unique": null
    },
    "default_width": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "20",
      "primaryKey": null,
      "unique": null
    },
    "default_height": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "10",
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "ShopeeOrder": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "shop_id": {
      "type": "Sequelize.BIGINT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "order_sn": {
      "type": "Sequelize.STRING(50)",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": true
    },
    "order_status": {
      "type": "Sequelize.STRING(50)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "buyer_username": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "buyer_user_id": {
      "type": "Sequelize.BIGINT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "recipient_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "recipient_phone": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "recipient_address": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "total_amount": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "currency": {
      "type": "Sequelize.STRING(10)",
      "allowNull": true,
      "defaultValue": "\"VND\"",
      "primaryKey": null,
      "unique": null
    },
    "items": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "shipping_carrier": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "tracking_number": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "order_create_time": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "order_paid_time": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "order_data": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "logistics_status": {
      "type": "Sequelize.STRING(50)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "ship_by_date": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "logistics_info": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_demo": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "synced_to_system": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "synced_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "ShopeeShop": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "shop_id": {
      "type": "Sequelize.BIGINT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "shop_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "access_token": {
      "type": "Sequelize.TEXT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "refresh_token": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "token_expires_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "shop_region": {
      "type": "Sequelize.STRING(10)",
      "allowNull": true,
      "defaultValue": "\"VN\"",
      "primaryKey": null,
      "unique": null
    },
    "is_active": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    }
  },
  "Status": {
    "uuid": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "Stock": {
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sku": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "unit": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "count": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "avarage_price": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "price_new": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "total_value": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "income": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "total": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "isSeen": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": true,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "is_alert_down_20": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": true,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "is_alert_down_10": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": true,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "nearest_expiry_date": {
      "type": "Sequelize.DATEONLY",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_alert_expiry_7_days": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": true,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "is_alert_expiry_3_days": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": true,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "barcode": {
      "type": "Sequelize.STRING(13)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": true
    }
  },
  "StockDisposal": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": null,
      "defaultValue": "Sequelize.UUIDV4",
      "primaryKey": true,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "disposal_code": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": true
    },
    "disposal_date": {
      "type": "Sequelize.DATEONLY",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "disposal_type": {
      "type": "Sequelize.ENUM(\"expired\"",
      "allowNull": false,
      "defaultValue": "\"other\"",
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.ENUM(\"pending\"",
      "allowNull": false,
      "defaultValue": "\"pending\"",
      "primaryKey": null,
      "unique": null
    },
    "total_value": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "created_by": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "approved_by": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "notes": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "StockDisposalItem": {
    "id": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": true,
      "unique": null
    },
    "disposal_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "stock_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "quantity": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "unit_price": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "reason": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "provider_id": {
      "type": "Sequelize.UUID",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_refundable": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "StockLog": {
    "stock_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "count": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "unitPrice": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "expiry_date": {
      "type": "Sequelize.DATEONLY",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_expired": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "StockName": {
    "stock_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "StockReturn": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": null,
      "defaultValue": "Sequelize.UUIDV4",
      "primaryKey": true,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "return_code": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": true
    },
    "provider_id": {
      "type": "Sequelize.UUID",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "return_date": {
      "type": "Sequelize.DATEONLY",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.ENUM(\"pending\"",
      "allowNull": false,
      "defaultValue": "\"pending\"",
      "primaryKey": null,
      "unique": null
    },
    "total_value": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "reason": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "notes": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "created_by": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "StockReturnItem": {
    "id": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": true,
      "unique": null
    },
    "return_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "stock_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "provider_id": {
      "type": "Sequelize.UUID",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "quantity": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "unit_price": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    }
  },
  "TableChair": {
    "x": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "y": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "floor": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "identify": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "capacity": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "4",
      "primaryKey": null,
      "unique": null
    },
    "is_bookable": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    },
    "min_party_size": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "1",
      "primaryKey": null,
      "unique": null
    },
    "max_party_size": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "4",
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "TaxBookConfig": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": true
    },
    "mst": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "ho_ten": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "dia_chi": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "dia_chi_kd": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "dien_thoai": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "email": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "stk": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "ngan_hang": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "industry_id": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": "\"trade\"",
      "primaryKey": null,
      "unique": null
    }
  },
  "TaxBookEntry": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "book_type": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"s1a\"",
      "primaryKey": null,
      "unique": null
    },
    "period": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "description": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": "\"\"",
      "primaryKey": null,
      "unique": null
    },
    "amount": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "cost": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "vat_amount": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "pit_amount": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "industry_id": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": "\"trade\"",
      "primaryKey": null,
      "unique": null
    },
    "note": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "quantity": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "unit": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "unit_price": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "tax_rate": {
      "type": "Sequelize.DECIMAL(5",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "special_tax": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "env_tax": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "resource_tax": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "land_tax": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "category": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "source": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"manual\"",
      "primaryKey": null,
      "unique": null
    },
    "order_date": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "TaxFee": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "order_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "type": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "value": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "note": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "pin": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "TiktokOrder": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "shop_id": {
      "type": "Sequelize.STRING(100)",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "order_id": {
      "type": "Sequelize.STRING(50)",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": true
    },
    "order_status": {
      "type": "Sequelize.STRING(50)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "buyer_message": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "recipient_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "recipient_phone": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "recipient_address": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "total_amount": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "currency": {
      "type": "Sequelize.STRING(10)",
      "allowNull": true,
      "defaultValue": "\"VND\"",
      "primaryKey": null,
      "unique": null
    },
    "items": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "shipping_provider": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "tracking_number": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "order_create_time": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "order_paid_time": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "order_data": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "synced_to_system": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "synced_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "TiktokShop": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "shop_id": {
      "type": "Sequelize.STRING(100)",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "shop_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "shop_cipher": {
      "type": "Sequelize.STRING(200)",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "access_token": {
      "type": "Sequelize.TEXT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "refresh_token": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "token_expires_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "shop_region": {
      "type": "Sequelize.STRING(10)",
      "allowNull": true,
      "defaultValue": "\"VN\"",
      "primaryKey": null,
      "unique": null
    },
    "is_active": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    }
  },
  "Todo": {
    "title": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "description": {
      "type": "Sequelize.TEXT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status_name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "Treasury": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "value": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "note": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "purchase_date": {
      "type": "Sequelize.DATEONLY",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "useful_life_months": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": "60",
      "primaryKey": null,
      "unique": null
    },
    "depreciation_method": {
      "type": "Sequelize.ENUM(\"straight_line\"",
      "allowNull": true,
      "defaultValue": "\"straight_line\"",
      "primaryKey": null,
      "unique": null
    },
    "residual_value": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "category": {
      "type": "Sequelize.ENUM(",
      "allowNull": true,
      "defaultValue": "\"equipment\"",
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.ENUM(\"active\"",
      "allowNull": true,
      "defaultValue": "\"active\"",
      "primaryKey": null,
      "unique": null
    },
    "monthly_depreciation": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": true,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "user_created_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "UpgradePromoCode": {
    "id": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": null,
      "primaryKey": true,
      "unique": null
    },
    "code": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "description": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "discount_type": {
      "type": "Sequelize.ENUM(\"percent\"",
      "allowNull": false,
      "defaultValue": "\"percent\"",
      "primaryKey": null,
      "unique": null
    },
    "discount_value": {
      "type": "Sequelize.FLOAT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "max_discount": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "applicable_packages": {
      "type": "Sequelize.JSON",
      "allowNull": true,
      "defaultValue": "null",
      "primaryKey": null,
      "unique": null
    },
    "max_uses": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": "null",
      "primaryKey": null,
      "unique": null
    },
    "used_count": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "start_date": {
      "type": "Sequelize.DATEONLY",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "end_date": {
      "type": "Sequelize.DATEONLY",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_active": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    }
  },
  "User": {
    "idParent": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "email": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": true
    },
    "referred_by": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "referral_link_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "login_status": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": "\"is_first_login\"",
      "primaryKey": null,
      "unique": null
    },
    "businessType": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "address": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "description": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "namePay": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "numberPay": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "bankPay": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "qrPayImage": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": "null",
      "primaryKey": null,
      "unique": null
    },
    "username": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "fullname": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "password": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "isEmailVerified": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "admin": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "image": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "companyName": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "companyAddress": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "hotline": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "phoneNumber": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "birthDate": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "domain": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "companyUUID": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "companyImage": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "companyMenuHash": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "companyStartTime": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "companyEndTime": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "tableChairsRowNumber": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": "3",
      "primaryKey": null,
      "unique": null
    },
    "tableChairsColNumber": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": "3",
      "primaryKey": null,
      "unique": null
    },
    "companyLogo": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "companyWebsite": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "credit_balance": {
      "type": "Sequelize.DECIMAL(15",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "changedPasswordAt": {
      "type": "\"TIMESTAMP\"",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "refreshTokenAt": {
      "type": "\"TIMESTAMP\"",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "UserCompanyParent": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "companyUUID": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "companyParentUUID": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_sender_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "UserLicense": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "purchased_package": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": "\"free\"",
      "primaryKey": null,
      "unique": null
    },
    "expired_date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "expired_time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "upgraded": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": true,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "pending": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": true,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "pending_date": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "pending_code": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sended_mail": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": null,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "api_request_count": {
      "type": "Sequelize.INTEGER",
      "allowNull": null,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "api_request_month": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "custom_api_limit": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": "null",
      "primaryKey": null,
      "unique": null
    }
  },
  "UserLink": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "identify": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "UserPaymentHistory": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "amount": {
      "type": "Sequelize.DECIMAL(10",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "currency": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"VND\"",
      "primaryKey": null,
      "unique": null
    },
    "package_name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "duration": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": "\"pending\"",
      "primaryKey": null,
      "unique": null
    },
    "type": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": "\"upgrade\"",
      "primaryKey": null,
      "unique": null
    },
    "transaction_code": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "note": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "UserRole": {
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "UserRoleGrant": {
    "user_role_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "UserRoleSetting": {
    "user_role_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "role_alias": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "permission": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "UserStaff": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "phone": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "email": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "address": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "permission_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date_join": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status_working": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "total_salary": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "total_day_working": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "UserStaffLog": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_staff_setting_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "commission": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "bonus": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "overtime_hour": {
      "type": "Sequelize.DOUBLE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "overtime_coefficient": {
      "type": "Sequelize.DOUBLE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "advence": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "fined": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "day_off_hour": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "setting_pin": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "UserStaffSetting": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_staff_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "permission_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date_get_salary": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "salary_by": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "salary_value": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "salary": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "working_hours": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "working_hours_value": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "hour_working_on_day": {
      "type": "Sequelize.DOUBLE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "pin": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status_working": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "Verify": {
    "email": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "code": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "done": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "WarehouseExport": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "stock": {
      "type": "Sequelize.TEXT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "code": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "unit": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "quantity": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "price": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "description": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_created_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "WarehouseExportLog": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "warehouse_export_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_created_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "value": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "WarehouseImport": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "phone": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "address": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "stock": {
      "type": "Sequelize.TEXT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "code": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "unit": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "quantity": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "price": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_created_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "WarehouseImportLog": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "warehouse_import_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_created_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "value": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "WarehouseTransfer": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "stock": {
      "type": "Sequelize.TEXT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "code": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "unit": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "quantity": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "price": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "phone": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "description": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "name_carrier": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "phone_carrier": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "receiving_warehouse": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "transportation": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "cost_transfer": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_created_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "softDeleted": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "WarehouseTransferLog": {
    "id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": true,
      "unique": true
    },
    "warehouse_transfer_id": {
      "type": "Sequelize.UUID",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_created_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "value": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "date": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "time": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  },
  "Webhook": {
    "partner_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "url": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "events": {
      "type": "Sequelize.JSON",
      "allowNull": false,
      "defaultValue": "[]",
      "primaryKey": null,
      "unique": null
    },
    "secret": {
      "type": "Sequelize.STRING(64)",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_active": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    },
    "last_triggered_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "failure_count": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    },
    "is_test": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "WebhookLog": {
    "webhook_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "partner_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "event_type": {
      "type": "Sequelize.STRING(50)",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "event_id": {
      "type": "Sequelize.STRING(50)",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "payload": {
      "type": "Sequelize.JSON",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "url": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "status_code": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "response_body": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "response_time_ms": {
      "type": "Sequelize.INTEGER",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "success": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    },
    "error_message": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "retry_count": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": "0",
      "primaryKey": null,
      "unique": null
    }
  },
  "ZaloConversation": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "oa_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_zalo_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "customer_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "customer_avatar": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "last_message": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "last_message_time": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_read": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "false",
      "primaryKey": null,
      "unique": null
    }
  },
  "ZaloMessage": {
    "conversation_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "oa_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "user_zalo_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "sender_type": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "message_id": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "message_text": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "message_type": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": "\"text\"",
      "primaryKey": null,
      "unique": null
    },
    "attachment_url": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "timestamp": {
      "type": "Sequelize.DATE",
      "allowNull": false,
      "defaultValue": "Sequelize.NOW",
      "primaryKey": null,
      "unique": null
    }
  },
  "ZaloOA": {
    "user_id": {
      "type": "Sequelize.INTEGER",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "oa_id": {
      "type": "Sequelize.STRING",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "oa_name": {
      "type": "Sequelize.STRING",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "access_token": {
      "type": "Sequelize.TEXT",
      "allowNull": false,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "refresh_token": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "oa_avatar": {
      "type": "Sequelize.TEXT",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    },
    "is_active": {
      "type": "Sequelize.BOOLEAN",
      "allowNull": false,
      "defaultValue": "true",
      "primaryKey": null,
      "unique": null
    },
    "token_expires_at": {
      "type": "Sequelize.DATE",
      "allowNull": true,
      "defaultValue": null,
      "primaryKey": null,
      "unique": null
    }
  }
};
