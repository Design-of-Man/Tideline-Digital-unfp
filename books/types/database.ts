export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          code: string
          created_at: string
          deductible_pct: number
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          is_tax_deductible: boolean
          name: string
          parent_id: string | null
          sort_order: number
          subtype: Database["public"]["Enums"]["account_subtype"]
          tax_category_id: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          deductible_pct?: number
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          is_tax_deductible?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number
          subtype: Database["public"]["Enums"]["account_subtype"]
          tax_category_id?: string | null
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          deductible_pct?: number
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          is_tax_deductible?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number
          subtype?: Database["public"]["Enums"]["account_subtype"]
          tax_category_id?: string | null
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_tax_category_fk"
            columns: ["tax_category_id"]
            isOneToOne: false
            referencedRelation: "tax_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          dba_name: string | null
          ein: string | null
          email: string | null
          entity_type: string
          fiscal_year_start_month: number
          id: number
          invoice_footer: string | null
          legal_name: string
          payment_instructions: string | null
          phone: string | null
          tax_state: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          dba_name?: string | null
          ein?: string | null
          email?: string | null
          entity_type?: string
          fiscal_year_start_month?: number
          id?: number
          invoice_footer?: string | null
          legal_name?: string
          payment_instructions?: string | null
          phone?: string | null
          tax_state?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          dba_name?: string | null
          ein?: string | null
          email?: string | null
          entity_type?: string
          fiscal_year_start_month?: number
          id?: number
          invoice_footer?: string | null
          legal_name?: string
          payment_instructions?: string | null
          phone?: string | null
          tax_state?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address: string | null
          code: string | null
          created_at: string
          email: string | null
          id: string
          is_1099: boolean
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          tax_id: string | null
          type: Database["public"]["Enums"]["contact_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_1099?: boolean
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          type?: Database["public"]["Enums"]["contact_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_1099?: boolean
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          tax_id?: string | null
          type?: Database["public"]["Enums"]["contact_type"]
          updated_at?: string
        }
        Relationships: []
      }
      distributions: {
        Row: {
          amount: number
          created_at: string
          distribution_date: string
          employee_id: string
          equity_account_id: string | null
          id: string
          journal_entry_id: string | null
          memo: string | null
          pay_from_account_id: string | null
          reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          distribution_date?: string
          employee_id: string
          equity_account_id?: string | null
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          pay_from_account_id?: string | null
          reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          distribution_date?: string
          employee_id?: string
          equity_account_id?: string | null
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          pay_from_account_id?: string | null
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "distributions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_equity_account_id_fkey"
            columns: ["equity_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_pay_from_account_id_fkey"
            columns: ["pay_from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_expenses: {
        Row: {
          amount: number
          category_account_id: string
          created_at: string
          deductible_pct: number
          description: string | null
          employee_id: string
          expense_date: string
          id: string
          journal_entry_accrual_id: string | null
          journal_entry_payment_id: string | null
          liability_account_id: string | null
          pay_from_account_id: string | null
          receipt_url: string | null
          reimbursable: boolean
          reimbursed_on: string | null
          status: Database["public"]["Enums"]["emp_expense_status"]
          tax_category_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category_account_id: string
          created_at?: string
          deductible_pct?: number
          description?: string | null
          employee_id: string
          expense_date?: string
          id?: string
          journal_entry_accrual_id?: string | null
          journal_entry_payment_id?: string | null
          liability_account_id?: string | null
          pay_from_account_id?: string | null
          receipt_url?: string | null
          reimbursable?: boolean
          reimbursed_on?: string | null
          status?: Database["public"]["Enums"]["emp_expense_status"]
          tax_category_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category_account_id?: string
          created_at?: string
          deductible_pct?: number
          description?: string | null
          employee_id?: string
          expense_date?: string
          id?: string
          journal_entry_accrual_id?: string | null
          journal_entry_payment_id?: string | null
          liability_account_id?: string | null
          pay_from_account_id?: string | null
          receipt_url?: string | null
          reimbursable?: boolean
          reimbursed_on?: string | null
          status?: Database["public"]["Enums"]["emp_expense_status"]
          tax_category_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_expenses_category_account_id_fkey"
            columns: ["category_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_expenses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_expenses_journal_entry_accrual_id_fkey"
            columns: ["journal_entry_accrual_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_expenses_journal_entry_payment_id_fkey"
            columns: ["journal_entry_payment_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_expenses_liability_account_id_fkey"
            columns: ["liability_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_expenses_pay_from_account_id_fkey"
            columns: ["pay_from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_expenses_tax_category_id_fkey"
            columns: ["tax_category_id"]
            isOneToOne: false
            referencedRelation: "tax_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          annual_salary: number | null
          created_at: string
          email: string | null
          equity_account_id: string | null
          first_name: string
          hired_on: string | null
          id: string
          is_active: boolean
          is_owner: boolean
          is_shareholder: boolean
          last_name: string
          ownership_pct: number | null
          pay_frequency: Database["public"]["Enums"]["pay_frequency"]
          title: string | null
          updated_at: string
        }
        Insert: {
          annual_salary?: number | null
          created_at?: string
          email?: string | null
          equity_account_id?: string | null
          first_name: string
          hired_on?: string | null
          id?: string
          is_active?: boolean
          is_owner?: boolean
          is_shareholder?: boolean
          last_name: string
          ownership_pct?: number | null
          pay_frequency?: Database["public"]["Enums"]["pay_frequency"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          annual_salary?: number | null
          created_at?: string
          email?: string | null
          equity_account_id?: string | null
          first_name?: string
          hired_on?: string | null
          id?: string
          is_active?: boolean
          is_owner?: boolean
          is_shareholder?: boolean
          last_name?: string
          ownership_pct?: number | null
          pay_frequency?: Database["public"]["Enums"]["pay_frequency"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_equity_account_id_fkey"
            columns: ["equity_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category_account_id: string
          created_at: string
          deductible_pct: number
          expense_date: string
          id: string
          journal_entry_id: string | null
          memo: string | null
          paid_from_account_id: string
          receipt_url: string | null
          recurring_id: string | null
          reference: string | null
          status: Database["public"]["Enums"]["expense_status"]
          tax_category_id: string | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount: number
          category_account_id: string
          created_at?: string
          deductible_pct?: number
          expense_date?: string
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          paid_from_account_id: string
          receipt_url?: string | null
          recurring_id?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          tax_category_id?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          category_account_id?: string
          created_at?: string
          deductible_pct?: number
          expense_date?: string
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          paid_from_account_id?: string
          receipt_url?: string | null
          recurring_id?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          tax_category_id?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_account_id_fkey"
            columns: ["category_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_from_account_id_fkey"
            columns: ["paid_from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_tax_category_id_fkey"
            columns: ["tax_category_id"]
            isOneToOne: false
            referencedRelation: "tax_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          amount: number
          description: string | null
          id: string
          income_account_id: string | null
          invoice_id: string
          line_no: number
          quantity: number
          tax_amount: number
          tax_note: string | null
          tax_treatment: Database["public"]["Enums"]["tax_treatment"]
          unit_price: number
        }
        Insert: {
          amount?: number
          description?: string | null
          id?: string
          income_account_id?: string | null
          invoice_id: string
          line_no?: number
          quantity?: number
          tax_amount?: number
          tax_note?: string | null
          tax_treatment?: Database["public"]["Enums"]["tax_treatment"]
          unit_price?: number
        }
        Update: {
          amount?: number
          description?: string | null
          id?: string
          income_account_id?: string | null
          invoice_id?: string
          line_no?: number
          quantity?: number
          tax_amount?: number
          tax_note?: string | null
          tax_treatment?: Database["public"]["Enums"]["tax_treatment"]
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_income_account_id_fkey"
            columns: ["income_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_number_counters: {
        Row: {
          last_number: number
          year: number
        }
        Insert: {
          last_number?: number
          year: number
        }
        Update: {
          last_number?: number
          year?: number
        }
        Relationships: []
      }
      invoice_sends: {
        Row: {
          cc_email: string | null
          error: string | null
          id: string
          invoice_id: string
          pdf_url: string | null
          provider: string | null
          provider_message_id: string | null
          sent_at: string
          status: string
          subject: string | null
          to_email: string
        }
        Insert: {
          cc_email?: string | null
          error?: string | null
          id?: string
          invoice_id: string
          pdf_url?: string | null
          provider?: string | null
          provider_message_id?: string | null
          sent_at?: string
          status?: string
          subject?: string | null
          to_email: string
        }
        Update: {
          cc_email?: string | null
          error?: string | null
          id?: string
          invoice_id?: string
          pdf_url?: string | null
          provider?: string | null
          provider_message_id?: string | null
          sent_at?: string
          status?: string
          subject?: string | null
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_sends_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_seq_counters: {
        Row: {
          client_code: string
          last_number: number
          type_code: string
        }
        Insert: {
          client_code: string
          last_number?: number
          type_code: string
        }
        Update: {
          client_code?: string
          last_number?: number
          type_code?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_paid: number
          ar_account_id: string | null
          contact_id: string | null
          created_at: string
          due_date: string | null
          id: string
          invoice_type: Database["public"]["Enums"]["invoice_kind"]
          issue_date: string
          journal_entry_id: string | null
          memo: string | null
          number: string | null
          pdf_url: string | null
          recurring_id: string | null
          sent_at: string | null
          service_period_end: string | null
          service_period_start: string | null
          state_tax_rate: number
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          surtax_rate: number
          tax_county: string | null
          tax_state: string
          tax_total: number
          terms: string | null
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          ar_account_id?: string | null
          contact_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_type?: Database["public"]["Enums"]["invoice_kind"]
          issue_date?: string
          journal_entry_id?: string | null
          memo?: string | null
          number?: string | null
          pdf_url?: string | null
          recurring_id?: string | null
          sent_at?: string | null
          service_period_end?: string | null
          service_period_start?: string | null
          state_tax_rate?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          surtax_rate?: number
          tax_county?: string | null
          tax_state?: string
          tax_total?: number
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          ar_account_id?: string | null
          contact_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_type?: Database["public"]["Enums"]["invoice_kind"]
          issue_date?: string
          journal_entry_id?: string | null
          memo?: string | null
          number?: string | null
          pdf_url?: string | null
          recurring_id?: string | null
          sent_at?: string | null
          service_period_end?: string | null
          service_period_start?: string | null
          state_tax_rate?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          surtax_rate?: number
          tax_county?: string | null
          tax_state?: string
          tax_total?: number
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_ar_account_id_fkey"
            columns: ["ar_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string | null
          entry_date: string
          id: string
          is_posted: boolean
          memo: string | null
          reference: string | null
          source: Database["public"]["Enums"]["entry_source"]
          source_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entry_date: string
          id?: string
          is_posted?: boolean
          memo?: string | null
          reference?: string | null
          source?: Database["public"]["Enums"]["entry_source"]
          source_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entry_date?: string
          id?: string
          is_posted?: boolean
          memo?: string | null
          reference?: string | null
          source?: Database["public"]["Enums"]["entry_source"]
          source_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      journal_lines: {
        Row: {
          account_id: string
          credit: number
          debit: number
          entry_id: string
          id: string
          line_no: number
          memo: string | null
        }
        Insert: {
          account_id: string
          credit?: number
          debit?: number
          entry_id: string
          id?: string
          line_no?: number
          memo?: string | null
        }
        Update: {
          account_id?: string
          credit?: number
          debit?: number
          entry_id?: string
          id?: string
          line_no?: number
          memo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      payments_received: {
        Row: {
          amount: number
          contact_id: string | null
          created_at: string
          deposit_account_id: string | null
          id: string
          income_account_id: string | null
          invoice_id: string | null
          journal_entry_id: string | null
          memo: string | null
          method: Database["public"]["Enums"]["payment_method"]
          payment_date: string
          reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          contact_id?: string | null
          created_at?: string
          deposit_account_id?: string | null
          id?: string
          income_account_id?: string | null
          invoice_id?: string | null
          journal_entry_id?: string | null
          memo?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          payment_date?: string
          reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          contact_id?: string | null
          created_at?: string
          deposit_account_id?: string | null
          id?: string
          income_account_id?: string | null
          invoice_id?: string | null
          journal_entry_id?: string | null
          memo?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          payment_date?: string
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_received_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_received_deposit_account_id_fkey"
            columns: ["deposit_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_received_income_account_id_fkey"
            columns: ["income_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_received_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_received_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          created_at: string
          employee_fica: number
          employee_id: string
          employer_fica: number
          federal_withholding: number
          futa: number
          gross_pay: number
          id: string
          journal_entry_id: string | null
          memo: string | null
          net_pay: number
          other_withholding: number
          pay_date: string
          pay_from_account_id: string | null
          payroll_liability_account_id: string | null
          payroll_tax_expense_account_id: string | null
          period_end: string | null
          period_start: string | null
          salary_expense_account_id: string | null
          state_withholding: number
          suta: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_fica?: number
          employee_id: string
          employer_fica?: number
          federal_withholding?: number
          futa?: number
          gross_pay?: number
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          net_pay?: number
          other_withholding?: number
          pay_date?: string
          pay_from_account_id?: string | null
          payroll_liability_account_id?: string | null
          payroll_tax_expense_account_id?: string | null
          period_end?: string | null
          period_start?: string | null
          salary_expense_account_id?: string | null
          state_withholding?: number
          suta?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_fica?: number
          employee_id?: string
          employer_fica?: number
          federal_withholding?: number
          futa?: number
          gross_pay?: number
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          net_pay?: number
          other_withholding?: number
          pay_date?: string
          pay_from_account_id?: string | null
          payroll_liability_account_id?: string | null
          payroll_tax_expense_account_id?: string | null
          period_end?: string | null
          period_start?: string | null
          salary_expense_account_id?: string | null
          state_withholding?: number
          suta?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_pay_from_account_id_fkey"
            columns: ["pay_from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_payroll_liability_account_id_fkey"
            columns: ["payroll_liability_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_payroll_tax_expense_account_id_fkey"
            columns: ["payroll_tax_expense_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_salary_expense_account_id_fkey"
            columns: ["salary_expense_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_expenses: {
        Row: {
          amount: number
          auto_post: boolean
          category_account_id: string
          created_at: string
          deductible_pct: number
          end_date: string | null
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          id: string
          interval_count: number
          is_active: boolean
          last_run_date: string | null
          memo: string | null
          name: string
          next_run_date: string
          paid_from_account_id: string
          start_date: string
          tax_category_id: string | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount: number
          auto_post?: boolean
          category_account_id: string
          created_at?: string
          deductible_pct?: number
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          interval_count?: number
          is_active?: boolean
          last_run_date?: string | null
          memo?: string | null
          name: string
          next_run_date?: string
          paid_from_account_id: string
          start_date?: string
          tax_category_id?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          auto_post?: boolean
          category_account_id?: string
          created_at?: string
          deductible_pct?: number
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          interval_count?: number
          is_active?: boolean
          last_run_date?: string | null
          memo?: string | null
          name?: string
          next_run_date?: string
          paid_from_account_id?: string
          start_date?: string
          tax_category_id?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_category_account_id_fkey"
            columns: ["category_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_paid_from_account_id_fkey"
            columns: ["paid_from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_tax_category_id_fkey"
            columns: ["tax_category_id"]
            isOneToOne: false
            referencedRelation: "tax_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_invoices: {
        Row: {
          amount: number
          ar_account_id: string | null
          bill_in_advance: boolean
          contact_id: string
          created_at: string
          description: string | null
          end_date: string | null
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          id: string
          income_account_id: string
          interval_count: number
          invoice_type: Database["public"]["Enums"]["invoice_kind"]
          is_active: boolean
          last_run_date: string | null
          memo: string | null
          name: string
          net_days: number
          next_run_date: string
          start_date: string
          state_tax_rate: number
          surtax_rate: number
          tax_county: string | null
          tax_treatment: Database["public"]["Enums"]["tax_treatment"]
          terms: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          ar_account_id?: string | null
          bill_in_advance?: boolean
          contact_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          income_account_id: string
          interval_count?: number
          invoice_type?: Database["public"]["Enums"]["invoice_kind"]
          is_active?: boolean
          last_run_date?: string | null
          memo?: string | null
          name: string
          net_days?: number
          next_run_date?: string
          start_date?: string
          state_tax_rate?: number
          surtax_rate?: number
          tax_county?: string | null
          tax_treatment?: Database["public"]["Enums"]["tax_treatment"]
          terms?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          ar_account_id?: string | null
          bill_in_advance?: boolean
          contact_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          income_account_id?: string
          interval_count?: number
          invoice_type?: Database["public"]["Enums"]["invoice_kind"]
          is_active?: boolean
          last_run_date?: string | null
          memo?: string | null
          name?: string
          net_days?: number
          next_run_date?: string
          start_date?: string
          state_tax_rate?: number
          surtax_rate?: number
          tax_county?: string | null
          tax_treatment?: Database["public"]["Enums"]["tax_treatment"]
          terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoices_ar_account_id_fkey"
            columns: ["ar_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_invoices_income_account_id_fkey"
            columns: ["income_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_categories: {
        Row: {
          code: string
          default_deductible_pct: number
          form_line: string | null
          id: string
          name: string
          notes: string | null
          sort_order: number
        }
        Insert: {
          code: string
          default_deductible_pct?: number
          form_line?: string | null
          id?: string
          name: string
          notes?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          default_deductible_pct?: number
          form_line?: string | null
          id?: string
          name?: string
          notes?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      tax_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          journal_entry_id: string | null
          memo: string | null
          pay_from_account_id: string | null
          payment_date: string
          period_label: string | null
          reference: string | null
          tax_account_id: string | null
          tax_type: Database["public"]["Enums"]["tax_payment_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          pay_from_account_id?: string | null
          payment_date?: string
          period_label?: string | null
          reference?: string | null
          tax_account_id?: string | null
          tax_type?: Database["public"]["Enums"]["tax_payment_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          journal_entry_id?: string | null
          memo?: string | null
          pay_from_account_id?: string | null
          payment_date?: string
          period_label?: string | null
          reference?: string | null
          tax_account_id?: string | null
          tax_type?: Database["public"]["Enums"]["tax_payment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_payments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_payments_pay_from_account_id_fkey"
            columns: ["pay_from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_payments_tax_account_id_fkey"
            columns: ["tax_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      account_normal_side: {
        Args: { p_type: Database["public"]["Enums"]["account_type"] }
        Returns: string
      }
      add_frequency: {
        Args: {
          p_date: string
          p_freq: Database["public"]["Enums"]["recurrence_frequency"]
          p_n: number
        }
        Returns: string
      }
      create_journal_entry: {
        Args: {
          p_date: string
          p_lines: Json
          p_memo: string
          p_reference?: string
          p_source?: Database["public"]["Enums"]["entry_source"]
          p_source_id?: string
        }
        Returns: string
      }
      f_account_balances: {
        Args: { p_as_of: string }
        Returns: {
          account_id: string
          balance: number
          code: string
          credit: number
          debit: number
          name: string
          subtype: Database["public"]["Enums"]["account_subtype"]
          type: Database["public"]["Enums"]["account_type"]
        }[]
      }
      f_deductions: {
        Args: { p_end: string; p_start: string }
        Returns: {
          category_code: string
          category_name: string
          deductible_amount: number
          form_line: string
          tax_category_id: string
          total_amount: number
        }[]
      }
      f_pnl: {
        Args: { p_end: string; p_start: string }
        Returns: {
          account_id: string
          amount: number
          code: string
          name: string
          subtype: Database["public"]["Enums"]["account_subtype"]
          type: Database["public"]["Enums"]["account_type"]
        }[]
      }
      generate_due_recurring_expenses: {
        Args: { p_through?: string }
        Returns: number
      }
      generate_due_recurring_invoices: {
        Args: { p_recurring_id?: string; p_through?: string }
        Returns: string[]
      }
      next_client_invoice_number: {
        Args: {
          p_contact: string
          p_type: Database["public"]["Enums"]["invoice_kind"]
        }
        Returns: string
      }
      next_invoice_number: { Args: { p_year?: number }; Returns: string }
      post_invoice: { Args: { p_invoice: string }; Returns: string }
      recalc_invoice_totals: { Args: { p_invoice: string }; Returns: undefined }
    }
    Enums: {
      account_subtype:
        | "bank"
        | "accounts_receivable"
        | "other_current_asset"
        | "fixed_asset"
        | "other_asset"
        | "accounts_payable"
        | "credit_card"
        | "payroll_liability"
        | "tax_liability"
        | "other_current_liability"
        | "long_term_liability"
        | "equity"
        | "retained_earnings"
        | "distributions"
        | "contributions"
        | "income"
        | "other_income"
        | "cogs"
        | "operating_expense"
        | "payroll_expense"
        | "tax_expense"
        | "other_expense"
      account_type: "asset" | "liability" | "equity" | "revenue" | "expense"
      contact_type: "customer" | "vendor" | "both"
      emp_expense_status: "submitted" | "approved" | "reimbursed" | "rejected"
      entry_source:
        | "manual"
        | "opening_balance"
        | "transfer"
        | "invoice"
        | "payment_received"
        | "expense"
        | "recurring_expense"
        | "payroll"
        | "distribution"
        | "employee_expense"
        | "tax_payment"
      expense_status: "unpaid" | "paid"
      invoice_kind: "standard" | "implementation" | "monthly"
      invoice_status: "draft" | "open" | "partial" | "paid" | "void"
      pay_frequency:
        | "weekly"
        | "biweekly"
        | "semimonthly"
        | "monthly"
        | "quarterly"
        | "annually"
      payment_method:
        | "bank_transfer"
        | "check"
        | "card"
        | "cash"
        | "ach"
        | "wire"
        | "paypal"
        | "stripe"
        | "other"
      recurrence_frequency:
        | "weekly"
        | "biweekly"
        | "semimonthly"
        | "monthly"
        | "quarterly"
        | "semiannually"
        | "annually"
      tax_payment_type:
        | "federal_income_est"
        | "state_income_est"
        | "payroll_941"
        | "payroll_940"
        | "state_payroll"
        | "state_franchise"
        | "sales_tax"
        | "property_tax"
        | "other"
      tax_treatment:
        | "nontaxable_service"
        | "taxable_tangible"
        | "advertising_materials_exempt"
        | "resale_certificate"
        | "out_of_state"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_subtype: [
        "bank",
        "accounts_receivable",
        "other_current_asset",
        "fixed_asset",
        "other_asset",
        "accounts_payable",
        "credit_card",
        "payroll_liability",
        "tax_liability",
        "other_current_liability",
        "long_term_liability",
        "equity",
        "retained_earnings",
        "distributions",
        "contributions",
        "income",
        "other_income",
        "cogs",
        "operating_expense",
        "payroll_expense",
        "tax_expense",
        "other_expense",
      ],
      account_type: ["asset", "liability", "equity", "revenue", "expense"],
      contact_type: ["customer", "vendor", "both"],
      emp_expense_status: ["submitted", "approved", "reimbursed", "rejected"],
      entry_source: [
        "manual",
        "opening_balance",
        "transfer",
        "invoice",
        "payment_received",
        "expense",
        "recurring_expense",
        "payroll",
        "distribution",
        "employee_expense",
        "tax_payment",
      ],
      expense_status: ["unpaid", "paid"],
      invoice_kind: ["standard", "implementation", "monthly"],
      invoice_status: ["draft", "open", "partial", "paid", "void"],
      pay_frequency: [
        "weekly",
        "biweekly",
        "semimonthly",
        "monthly",
        "quarterly",
        "annually",
      ],
      payment_method: [
        "bank_transfer",
        "check",
        "card",
        "cash",
        "ach",
        "wire",
        "paypal",
        "stripe",
        "other",
      ],
      recurrence_frequency: [
        "weekly",
        "biweekly",
        "semimonthly",
        "monthly",
        "quarterly",
        "semiannually",
        "annually",
      ],
      tax_payment_type: [
        "federal_income_est",
        "state_income_est",
        "payroll_941",
        "payroll_940",
        "state_payroll",
        "state_franchise",
        "sales_tax",
        "property_tax",
        "other",
      ],
      tax_treatment: [
        "nontaxable_service",
        "taxable_tangible",
        "advertising_materials_exempt",
        "resale_certificate",
        "out_of_state",
      ],
    },
  },
} as const
