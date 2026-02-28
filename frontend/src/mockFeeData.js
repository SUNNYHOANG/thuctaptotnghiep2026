// mockFeeData.js
export const feeData = {
  students: [
    {
      id: 'SV001',
      name: 'Nguyễn Văn A',
      mssv: '20260001',
      total: 12000000,
      paid: 6000000,
      due: 6000000,
      deadline: '2026-03-31',
      receipts: [
        {
          id: 'PT20260201',
          date: '2026-02-01',
          amount: 6000000,
          method: 'Online',
          status: 'Đã thanh toán',
          details: [
            { name: 'Học phí HK2/2025-2026', amount: 5000000 },
            { name: 'Phí dịch vụ', amount: 1000000 }
          ]
        }
      ],
      debtDetails: [
        { name: 'Học phí HK2/2025-2026', amount: 5000000, status: 'Chưa đóng' },
        { name: 'Phí dịch vụ', amount: 1000000, status: 'Chưa đóng' }
      ],
      notifications: [
        {
          date: '2026-02-20',
          message: 'Bạn còn nợ học phí HK2/2025-2026. Hạn cuối đóng: 31/03/2026.'
        }
      ]
    },
    {
      id: 'SV002',
      name: 'Trần Thị B',
      mssv: '20260002',
      total: 10000000,
      paid: 10000000,
      due: 0,
      deadline: '2026-03-31',
      receipts: [
        {
          id: 'PT20260202',
          date: '2026-02-02',
          amount: 10000000,
          method: 'Online',
          status: 'Đã thanh toán',
          details: [
            { name: 'Học phí HK2/2025-2026', amount: 9000000 },
            { name: 'Phí dịch vụ', amount: 1000000 }
          ]
        }
      ],
      debtDetails: [],
      notifications: []
    }
  ]
};
