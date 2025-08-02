import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  Upload,
  Trash2,
  Star,
  Mail,
  Phone,
} from 'lucide-react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  Row,
  HeaderGroup,
  Cell,
} from '@tanstack/react-table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import InvitePlayerModal from '../../components/players/InvitePlayerModal';

interface Player {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  dup_rating: number | null;
  role: string;
}

interface PlayersViewProps {
  players: Player[];
  isLoading: boolean;
  isAdmin: boolean;
  onDeletePlayer?: (playerId: string) => Promise<void>;
  onInvitePlayer?: (playerData: any) => Promise<void>;
  onRefreshPlayers?: () => void;
  onUploadExcel?: () => void;
}

const columnHelper = createColumnHelper<Player>();

const PlayersView: React.FC<PlayersViewProps> = ({
  players,
  isLoading,
  isAdmin,
  onDeletePlayer,
  onInvitePlayer,
  onRefreshPlayers,
  onUploadExcel
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const handleDeletePlayer = async (playerId: string) => {
    if (!window.confirm('Are you sure you want to delete this player? This action cannot be undone.')) {
      return;
    }

    if (onDeletePlayer) {
      try {
        await onDeletePlayer(playerId);
      } catch (error) {
        console.error('Error deleting player:', error);
      }
    }
  };

  const columns: ColumnDef<Player>[] = [
    columnHelper.accessor('first_name', {
      header: 'First Name',
      cell: (info: any) => info.getValue(),
    }),
    columnHelper.accessor('last_name', {
      header: 'Last Name',
      cell: (info: any) => info.getValue(),
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info: any) => (
        <div className="flex items-center">
          <Mail size={16} className="mr-2 text-gray-400" />
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: (info: any) => (
        info.getValue() ? (
          <div className="flex items-center">
            <Phone size={16} className="mr-2 text-gray-400" />
            {info.getValue()}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    }),
    columnHelper.accessor('dup_rating', {
      header: 'DUPR Rating',
      cell: (info: any) => (
        <div className="flex items-center">
          <Star size={16} className="mr-2 text-yellow-400" />
          {info.getValue()?.toFixed(1) || '-'}
        </div>
      ),
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: (info: any) => (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
          info.getValue() === 'player'
            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            : 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
        }`}>
          {info.getValue()}
        </span>
      ),
    }),
  ];

  if (isAdmin) {
    columns.push(
      columnHelper.accessor('_id', {
        header: 'Actions',
        cell: (info: any) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeletePlayer(info.getValue())}
            className="text-error-600 hover:bg-error-50 hover:text-error-700 dark:text-error-400 dark:hover:bg-error-900/30"
          >
            <Trash2 size={16} />
          </Button>
        ),
      })
    );
  }

  const table = useReactTable({
    data: players,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter: searchQuery,
    },
    onGlobalFilterChange: setSearchQuery,
  });

  const handleInviteSuccess = () => {
    setIsInviteModalOpen(false);
    if (onRefreshPlayers) {
      onRefreshPlayers();
    }
  };

  const handleUploadExcel = () => {
    if (onUploadExcel) {
      onUploadExcel();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">Players</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse and manage players in your leagues</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              leftIcon={<Upload size={16} />}
              onClick={handleUploadExcel}
            >
              Upload Excel
            </Button>
            <Button
              leftIcon={<UserPlus size={16} />}
              onClick={() => setIsInviteModalOpen(true)}
            >
              Invite Player
            </Button>
          </div>
        )}
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search size={16} />}
          className="max-w-md"
        />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              {table.getHeaderGroups().map((headerGroup: HeaderGroup<Player>) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header: any) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    Loading players...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No players found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row: Row<Player>) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {row.getVisibleCells().map((cell: Cell<Player, unknown>) => (
                      <td
                        key={cell.id}
                        className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <InvitePlayerModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={handleInviteSuccess}
        leagueId=""
      />
    </div>
  );
};

export default PlayersView;