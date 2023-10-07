import PropTypes from 'prop-types';
import { format } from 'date-fns';
import {
  Avatar,
  Box,
  Card,
  Checkbox,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from '@mui/material';
import { Scrollbar } from 'src/components/scrollbar';
import { getInitials } from 'src/utils/get-initials';
import { Budget } from 'src/types/budget/types';

type CategoryListProps = {
  budget: Budget
};

export const CategoryList = (props: CategoryListProps) => {
  const { budget } = props;
  return (
    <Card>
      <Scrollbar>
        <Box sx={{ minWidth: 800 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  Name
                </TableCell>
                <TableCell>
                  Email
                </TableCell>
                <TableCell>
                  Location
                </TableCell>
                <TableCell>
                  Phone
                </TableCell>
                <TableCell>
                  Signed Up
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {budget.categories.map((category) => {
                return (
                  <TableRow
                    hover
                    key={category.id}
                  >
                    <TableCell>
                      <Stack
                        alignItems="center"
                        direction="row"
                        spacing={2}
                      >
                        <Avatar>
                          C
                        </Avatar>
                        <Typography variant="subtitle2">
                          {category.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      something
                    </TableCell>
                    <TableCell>
                      something
                    </TableCell>
                    <TableCell>
                      something
                    </TableCell>
                    <TableCell>
                      something
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Scrollbar>
    </Card>
  );
};