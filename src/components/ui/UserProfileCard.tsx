import {
  Avatar,
  Button,
} from "@mui/material";

interface Props {
  username: string;
  role: string;
  onLogout: () => void;
}

export default function UserProfileCard({
  username,
  role,
  onLogout,
}: Props) {
  return (
    <div
      className="
      mt-auto
      rounded-2xl
      border
      bg-slate-50
      p-4
    "
    >
      <div className="flex items-center gap-3">

        <Avatar>
          {username
            .charAt(0)
            .toUpperCase()}
        </Avatar>

        <div>
          <h4 className="font-semibold">
            {username}
          </h4>

          <p className="text-xs text-gray-500">
            {role}
          </p>
        </div>

      </div>

      <Button
        fullWidth
        variant="outlined"
        sx={{ mt: 2 }}
        onClick={onLogout}
      >
        Logout
      </Button>
    </div>
  );
}