import { PillButton, useTheme } from "@fiftyone/components";
import * as fos from "@fiftyone/state";
import {
  useClearActive,
  useClearFiltered,
  useClearVisibility,
  useDeleteGroup,
  useRenameGroup,
} from "@fiftyone/state/src/hooks/useGroupEntries";
import {
  numGroupFieldsActive,
  numGroupFieldsFiltered,
  numGroupFieldsVisible,
} from "@fiftyone/state/src/recoil/groupEntries";
import {
  Add,
  Check,
  Close,
  Edit,
  FilterList,
  Remove,
} from "@mui/icons-material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import React, { useRef, useState } from "react";
import {
  SetterOrUpdater,
  useRecoilStateLoadable,
  useRecoilValue,
  useRecoilValueLoadable,
} from "recoil";
import styled from "styled-components";
import Draggable from "./Draggable";

type PillEntry = {
  dataCy?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  text: string;
  title: string;
};

const Pills = ({ entries }: { entries: PillEntry[] }) => {
  const theme = useTheme();

  return (
    <>
      {entries.map(({ dataCy, ...data }, i) => (
        <PillButton
          {...data}
          data-cy={dataCy}
          highlight={false}
          key={i}
          open={false}
          style={{
            height: "1.5rem",
            fontSize: "0.8rem",
            lineHeight: "1rem",
            color: theme.text.primary,
            padding: "0.25rem 0.5rem",
            margin: "0 0.25rem",
          }}
        />
      ))}
    </>
  );
};

const PlusMinusButton = ({ expanded }: { expanded: boolean }) =>
  expanded ? <Remove /> : <Add />;

const GroupHeader = styled.div`
  border-bottom: 2px solid ${({ theme }) => theme.primary.softBorder};
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  margin-left: 2px;
  padding: 3px 3px 3px 8px;
  text-transform: uppercase;
  display: flex;
  justify-content: space-between;
  vertical-align: middle;
  align-items: center;
  font-weight: bold;
  color: ${({ theme }) => theme.text.secondary};
  background: ${({ theme }) => theme.neutral.softBg};
  user-select: text;

  svg {
    font-size: 1.25em;
    vertical-align: middle;
  }
  cursor: pointer;
`;

const GroupInput = styled.input`
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  text-transform: uppercase;
  font-weight: bold;
  color: ${({ theme }) => theme.text.secondary};
`;

type GroupEntryProps = {
  entryKey: string;
  pills?: React.ReactNode;
  title: string;
  setValue?: (name: string) => Promise<boolean>;
  onDelete?: () => void;
  before?: React.ReactNode;
  expanded: boolean;
  trigger: (
    event: React.MouseEvent<HTMLDivElement>,
    key: string,
    cb: () => void
  ) => void;
} & React.HTMLProps<HTMLDivElement>;

const GroupEntry = React.memo(
  ({
    entryKey,
    title,
    pills,
    onDelete,
    setValue,
    before,
    onClick,
    expanded,
    trigger,
  }: GroupEntryProps) => {
    const [editing, setEditing] = useState(false);
    const [hovering, setHovering] = useState(false);
    const ref = useRef<HTMLInputElement>(null);
    const canCommit = useRef(false);
    const theme = useTheme();
    const notify = fos.useNotification();
    const canModifySidebarGroup = useRecoilValue(fos.canModifySidebarGroup);
    const disabled = canModifySidebarGroup.enabled !== true;

    return (
      <div
        data-cy={`sidebar-group-entry-${title}`}
        style={{
          boxShadow: `0 2px 20px ${theme.custom.shadow}`,
        }}
      >
        <div style={{ position: "relative", cursor: "pointer" }}>
          <Draggable
            color={theme.primary.softBorder}
            entryKey={entryKey}
            trigger={trigger}
          >
            <GroupHeader
              title={title}
              data-cy={`sidebar-group-${title}`}
              onMouseEnter={() => !hovering && setHovering(true)}
              onMouseLeave={() => hovering && setHovering(false)}
              onMouseDown={(event) => {
                editing ? event.stopPropagation() : (canCommit.current = true);
              }}
              onMouseMove={() => (canCommit.current = false)}
              style={{
                cursor: "unset",
                borderBottomColor: editing
                  ? theme.primary.plainColor
                  : theme.primary.softBorder,
              }}
              onMouseUp={(event) => {
                canCommit.current && onClick && onClick(event);
              }}
            >
              {before}
              <GroupInput
                ref={ref}
                maxLength={40}
                style={{
                  flexGrow: 1,
                  pointerEvents: editing ? "unset" : "none",
                  textOverflow: "ellipsis",
                }}
                defaultValue={title}
                onKeyDown={(event) => {
                  const inputElem = event.target as HTMLInputElement;
                  const updatedTitle = inputElem.value;
                  const unchanged = updatedTitle === title;
                  if (event.key === "Enter") {
                    if (unchanged) {
                      return inputElem.blur();
                    }
                    setValue?.(updatedTitle).then((success) => {
                      if (!success) {
                        inputElem.value = title;
                        notify({
                          msg: "Failed to rename the group",
                          variant: "error",
                        });
                      }
                      inputElem.blur();
                    });

                    return;
                  }
                  if (event.key === "Escape") {
                    inputElem.blur();
                  }
                }}
                onFocus={() => !editing && setEditing(true)}
                onBlur={() => {
                  if (editing) {
                    setEditing(false);
                  }
                }}
              />
              {hovering && !editing && setValue && !disabled && (
                <span title={"Rename group"} style={{ margin: "0 0.25rem" }}>
                  <Edit
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={() => {
                      setEditing(true);
                      if (ref.current) {
                        ref.current.setSelectionRange(
                          0,
                          ref.current.value.length
                        );
                        ref.current.focus();
                      }
                    }}
                  />
                </span>
              )}
              {pills}
              {onDelete && !editing && !disabled && (
                <span title={"Delete group"} style={{ margin: "0 0.25rem" }}>
                  <Close
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={() => onDelete()}
                  />
                </span>
              )}
              <span>
                <PlusMinusButton expanded={expanded} />
              </span>
            </GroupHeader>
          </Draggable>
        </div>
      </div>
    );
  }
);

const useShown = (
  key: string,
  modal: boolean
): [boolean, SetterOrUpdater<boolean>] => {
  const expanded = useRecoilValueLoadable(
    fos.groupShown({ group: key, modal, loading: false })
  );
  const [expandedLoading, setExpanded] = useRecoilStateLoadable(
    fos.groupShown({ group: key, modal, loading: true })
  );

  if (expanded.state === "hasValue") {
    return [expanded.contents, setExpanded];
  }

  if (expandedLoading.state !== "hasValue") {
    throw new Error(expandedLoading.contents);
  }
  return [expandedLoading.contents, setExpanded];
};

interface PathGroupProps {
  entryKey: string;
  name: string;
  modal: boolean;
  mutable?: boolean;
  trigger: (
    event: React.MouseEvent<HTMLDivElement>,
    key: string,
    cb: () => void
  ) => void;
}

export const PathGroupEntry = React.memo(
  ({ entryKey, name, modal, mutable = true, trigger }: PathGroupProps) => {
    const [expanded, setExpanded] = useShown(name, modal);
    const renameGroup = useRenameGroup(!modal, name);
    const onDelete = useDeleteGroup(!modal && mutable, name);

    return (
      <GroupEntry
        entryKey={entryKey}
        title={name.toUpperCase()}
        expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        setValue={renameGroup}
        onDelete={onDelete}
        pills={
          <Pills
            entries={[
              {
                count: useRecoilValue(
                  numGroupFieldsFiltered({ modal, group: name })
                ),
                dataCy: `clear-filters-${name}`,
                icon: <FilterList />,
                onClick: useClearFiltered(modal, name),

                title: `Clear ${name} filters`,
              },
              {
                count: useRecoilValue(
                  numGroupFieldsVisible({ modal, group: name })
                ),
                dataCy: `clear-visibility-${name}`,
                icon: <VisibilityIcon />,
                onClick: useClearVisibility(modal, name),
                title: `Clear ${name} visibility`,
              },
              {
                count: useRecoilValue(
                  numGroupFieldsActive({ modal, group: name })
                ),
                dataCy: `clear-shown-${name}`,
                icon: <Check />,
                onClick: useClearActive(modal, name),
                title: `Clear shown ${name}`,
              },
            ]
              .filter(({ count }) => count > 0)
              .map(({ count, ...rest }) => ({
                ...rest,
                text: count.toLocaleString(),
              }))}
          />
        }
        trigger={trigger}
      />
    );
  }
);
